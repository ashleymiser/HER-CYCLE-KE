/**
 * CycleRing — circular progress indicator styled as a cycle.
 * Used for assessment step progress (Day 2-3) and as a visual motif elsewhere.
 *
 * progress: 0–1
 * segments: optional number of tick marks around the ring (e.g. total steps)
 */
export default function CycleRing({
  progress = 0,
  segments = 0,
  size = 120,
  strokeWidth = 8,
  color = 'var(--color-rust)',
  trackColor = 'var(--color-sand-dark)',
  children,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1))
  const center = size / 2

  const ticks = []
  if (segments > 1) {
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI - Math.PI / 2
      const x1 = center + (radius - strokeWidth / 2 - 2) * Math.cos(angle)
      const y1 = center + (radius - strokeWidth / 2 - 2) * Math.sin(angle)
      const x2 = center + (radius + strokeWidth / 2 + 2) * Math.cos(angle)
      const y2 = center + (radius + strokeWidth / 2 + 2) * Math.sin(angle)
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--color-cream)"
          strokeWidth={2}
        />
      )
    }
  }

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        {ticks}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
