export function RingedPlanetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Planet body */}
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.9" />

      {/* Rings */}
      <ellipse cx="12" cy="12" rx="10" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="12" cy="12" rx="8" ry="2.4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

      {/* Ring shadow on planet */}
      <path d="M 6.5 11 Q 12 10.5 17.5 11" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  )
}
