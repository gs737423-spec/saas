const SIZE = 88
const STROKE = 7
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

function colorFor(score: number): string {
  if (score >= 80) return '#3BE38E'
  if (score >= 50) return '#FFC95A'
  return '#FF5E7D'
}

// Anel de saúde — SVG puro, sem lib. `score` vem de sinais reais (ver
// computeHealthScore em AdminCompany.tsx), não é número inventado.
export default function HealthScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const offset = CIRC - (clamped / 100) * CIRC
  const color = colorFor(clamped)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0 -rotate-90">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-border-subtle" />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={SIZE / 2} y={SIZE / 2} transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`} textAnchor="middle" dominantBaseline="central" className="fill-text-primary" style={{ fontSize: 22, fontWeight: 700 }}>
        {clamped}
      </text>
    </svg>
  )
}
