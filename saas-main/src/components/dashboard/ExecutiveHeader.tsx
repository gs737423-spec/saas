const periods = ['30 dias', '90 dias', '12 meses'] as const

// Compact meta strip: period selector. Single row.
export default function ExecutiveHeader() {
  return (
    <div className="overview-glass flex items-center justify-end rounded-xl px-3.5 py-2.5">
      {/* Period selector */}
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border-subtle bg-bg-primary/40 p-0.5">
        {periods.map((p, i) => (
          <button
            key={p}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              i === 0 ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
