export default function GoldBarIcon({ gram }: { gram: string }) {
  return (
    <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`g-${gram}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8D49A" />
          <stop offset="40%" stopColor="#C9A84C" />
          <stop offset="80%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="92" rx="56" ry="6" fill="rgba(0,0,0,0.4)" />
      <path d="M20 30 L140 30 L148 75 L12 75 Z" fill={`url(#g-${gram})`} />
      <path d="M30 18 L130 18 L140 30 L20 30 Z" fill="#E8D49A" />
      <path d="M12 75 L20 30 L30 18 L22 65 Z" fill="#8B6914" />
      <path d="M40 30 L100 30 L95 26 L45 26 Z" fill="rgba(255,255,255,0.35)" />
      <path d="M30 38 L130 38" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      <path d="M28 65 L132 65" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
      <text x="80" y="54" textAnchor="middle" fontSize="10" fill="#1A1612" fontFamily="serif" fontWeight="700" letterSpacing="3">ANTAM</text>
      <text x="80" y="68" textAnchor="middle" fontSize="8" fill="rgba(26,22,18,0.7)" fontFamily="serif">{gram}g</text>
      <rect x="56" y="40" width="48" height="14" rx="2" fill="rgba(0,0,0,0.12)" />
      <text x="80" y="50" textAnchor="middle" fontSize="6" fill="rgba(26,22,18,0.6)" fontFamily="sans-serif" letterSpacing="1">CERTICARD</text>
    </svg>
  );
}
