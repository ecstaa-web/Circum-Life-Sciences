/**
 * Circum Life Sciences — Cloudflare Worker
 *
 * Proxies /api/* to the FastAPI backend with:
 * - Security headers on API responses
 * - Client IP forwarding (CF-Connecting-IP → X-Forwarded-For)
 * - Edge rate limiting (login, careers, global API)
 * - CORS preflight passthrough
 *
 * Deploy WITHOUT Node.js:
 *   1. Cloudflare Dashboard → Workers → Create → paste this file
 *   2. Settings → Variables → BACKEND_ORIGIN = https://your-api-host
 *   3. Triggers → Route → www.example.com/api/*
 *   Full guide: cloudflare/worker/DEPLOI-SANS-NODE.txt
 *
 * Optional (if Node.js installed): cd cloudflare/worker && npx wrangler deploy
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '0',
};

/** @type {Record<string, { max: number; windowSec: number }>} */
const RATE_RULES = {
  'auth/login': { max: 10, windowSec: 3600 },
  'auth/forgot-password': { max: 5, windowSec: 3600 },
  'auth/google/exchange': { max: 20, windowSec: 3600 },
  'careers/apply': { max: 5, windowSec: 3600 },
  'newsletter/subscribe': { max: 10, windowSec: 3600 },
};

const GLOBAL_API_LIMIT = { max: 600, windowSec: 3600 };

/**
 * @param {Request} request
 * @param {string} key
 * @param {{ max: number; windowSec: number }} rule
 * @param {Cache} cache
 */
async function isRateLimited(request, key, rule, cache) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const cacheKey = `https://rate-limit.circum/${ip}/${key}`;
  const now = Date.now();
  const windowMs = rule.windowSec * 1000;

  const existing = await cache.match(cacheKey);
  /** @type {{ count: number; reset: number }} */
  let bucket = existing ? await existing.json() : { count: 0, reset: now + windowMs };

  if (now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
  }

  bucket.count += 1;

  await cache.put(
    cacheKey,
    new Response(JSON.stringify(bucket), {
      headers: {
        'Cache-Control': `max-age=${rule.windowSec}`,
        'Content-Type': 'application/json',
      },
    }),
  );

  return bucket.count > rule.max;
}

/**
 * @param {string} pathname
 */
function apiSubpath(pathname) {
  return pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
}

/**
 * @param {Request} request
 * @param {string} backendOrigin
 * @param {Cache} cache
 */
async function proxyApi(request, backendOrigin, cache) {
  const url = new URL(request.url);
  const sub = apiSubpath(url.pathname);

  if (await isRateLimited(request, 'global', GLOBAL_API_LIMIT, cache)) {
    return jsonError(429, 'Too many requests. Please try again later.');
  }

  for (const [prefix, rule] of Object.entries(RATE_RULES)) {
    if (sub === prefix || sub.startsWith(prefix + '/')) {
      if (await isRateLimited(request, prefix, rule, cache)) {
        return jsonError(429, 'Too many requests. Please try again later.');
      }
      break;
    }
  }

  const target = new URL('/api/' + sub + url.search, backendOrigin);

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('Host', new URL(backendOrigin).host);
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) {
    forwardHeaders.set('X-Forwarded-For', clientIp);
    forwardHeaders.set('X-Real-IP', clientIp);
  }
  forwardHeaders.delete('cf-connecting-ip');
  forwardHeaders.delete('cf-ray');
  forwardHeaders.delete('cf-visitor');

  const init = {
    method: request.method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  let response;
  try {
    response = await fetch(target.toString(), init);
  } catch {
    return jsonError(502, 'Backend unavailable');
  }

  const outHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    outHeaders.set(k, v);
  }
  outHeaders.delete('server');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  });
}

/**
 * @param {number} status
 * @param {string} detail
 */
function jsonError(status, detail) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...SECURITY_HEADERS,
  });
  return new Response(JSON.stringify({ detail }), { status, headers });
}

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      const origin = env.BACKEND_ORIGIN;
      if (!origin) {
        return jsonError(500, 'BACKEND_ORIGIN not configured');
      }
      return proxyApi(request, origin, caches.default);
    }

    // Non-API traffic: pass through (Cloudflare Pages / origin)
    return fetch(request);
  },
};

/** @typedef {{ BACKEND_ORIGIN: string }} Env */
