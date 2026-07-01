const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const IS_PROD = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';

const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

app.disable('x-powered-by');

app.use((req, res, next) => {
  const path = (req.path || '').replace(/\/$/, '');
  const isAdmin = path === '/admin' || path === '/admin.html';
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', isAdmin ? 'DENY' : 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  let csp = process.env.CONTENT_SECURITY_POLICY || DEFAULT_CSP;
  if (!isAdmin) csp = csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'");
  res.setHeader('Content-Security-Policy', csp);
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

function proxyApiRequest(req, res) {
  let target;
  try {
    target = new URL(BACKEND_URL);
  } catch {
    res.status(500).json({ detail: 'Invalid BACKEND_URL' });
    return;
  }

  const lib = target.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;

  const options = {
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: '/api' + req.url,
    method: req.method,
    headers,
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.status(502).json({ detail: 'Backend unavailable' });
    }
  });

  req.pipe(proxyReq);
}

app.use('/api', proxyApiRequest);

// Page admin (auth + édition de contenu) — /admin et /admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Pages CMS dynamiques (blocs)
app.get('/p/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'cms-page.html'));
});

if (!IS_PROD) {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
}

app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html',
}));

app.listen(PORT, HOST, () => {
  console.log(`Circum static site listening on http://${HOST}:${PORT}`);
  console.log(`API proxy -> ${BACKEND_URL}/api`);
});
