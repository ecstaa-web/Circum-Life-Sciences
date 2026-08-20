interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export default function Logo({ size = 40, showWordmark = false, className = '' }: LogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={showWordmark ? true : undefined}
      role={showWordmark ? undefined : 'img'}
      aria-label={showWordmark ? undefined : 'RetroPulse'}
    >
      <defs>
        <linearGradient id="logo-bg" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4338ca" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="logo-shine" x1="120" y1="80" x2="360" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="logo-pulse" x1="96" y1="300" x2="416" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.2" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="logo-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#312e81" floodOpacity="0.35" />
        </filter>
        <clipPath id="logo-clip">
          <rect x="64" y="64" width="384" height="384" rx="96" />
        </clipPath>
      </defs>

      <g filter="url(#logo-soft)">
        <rect x="64" y="64" width="384" height="384" rx="96" fill="url(#logo-bg)" />
        <rect x="64" y="64" width="384" height="384" rx="96" fill="url(#logo-shine)" />
        <rect x="78" y="78" width="356" height="356" rx="88" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      </g>

      <g clipPath="url(#logo-clip)" opacity="0.55">
        <circle cx="256" cy="256" r="148" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="6 10" />
        <circle cx="256" cy="256" r="118" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
      </g>

      <g opacity="0.92">
        <path
          d="M176 168h160c14 0 24 10 24 24v88c0 12-8 22-20 24l-24 8c-6 2-12 2-18 0l-24-8c-12-2-20-12-20-24v-88c0-14 10-24 24-24z"
          fill="#ffffff"
          fillOpacity="0.12"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        <path d="M196 188h24v56h-24zM228 188h24v56h-24zM260 188h24v56h-24zM292 188h24v56h-24z" fill="#ffffff" fillOpacity="0.08" />
        <rect x="318" y="204" width="10" height="28" rx="3" fill="url(#logo-gold)" />
      </g>

      <g fill="#ffffff">
        <path d="M188 214h44c28 0 44 14 44 36c0 16-8 28-22 33l34 43h-36l-28-36h-26v36h-32V214zm32 58c14 0 22-6 22-18s-8-18-22-18h-12v36h12z" />
        <path d="M292 214h58c24 0 38 12 38 32c0 14-7 24-18 29l28 41h-38l-24-34h-22v34h-32V214zm54 52c10 0 16-5 16-14s-6-14-16-14h-22v28h22z" />
      </g>

      <path
        d="M112 318H168l20-40 28 80 28-60 28 40 28-50 28 30H400"
        stroke="url(#logo-pulse)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="328" cy="288" r="7" fill="url(#logo-gold)" stroke="#ffffff" strokeWidth="2" />
    </svg>
  )

  if (!showWordmark) return mark

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      <div className="leading-none">
        <span className="font-display font-bold text-lg tracking-tight text-rp-text block">RetroPulse</span>
        <span className="text-[10px] text-rp-muted tracking-wide">Console marketplace</span>
      </div>
    </div>
  )
}
