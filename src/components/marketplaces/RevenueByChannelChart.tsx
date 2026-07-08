import { revenueData, getMarketplaceColor } from '@/data/mockData'

const channels: { key: 'mercadoLivre' | 'shopee' | 'amazon' | 'lojaPropria'; label: 'Mercado Livre' | 'Shopee' | 'Amazon' | 'Loja Própria' }[] = [
  { key: 'mercadoLivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojaPropria', label: 'Loja Própria' },
]

const recentMonths = revenueData.slice(-6)
const maxTotal = Math.max(...recentMonths.map((m) => m.total))

export default function RevenueByChannelChart() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Receita por Canal</h3>
          <p className="mt-0.5 text-xs text-text-muted">Faturamento mensal empilhado por marketplace · últimos 6 meses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
          {channels.map((c) => (
            <span key={c.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: getMarketplaceColor(c.label) }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-52 items-stretch gap-3 sm:h-60 sm:gap-4">
        {recentMonths.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className="flex w-full flex-1 flex-col-reverse items-stretch overflow-hidden rounded-t-md" style={{ height: `${(m.total / maxTotal) * 100}%` }}>
              {channels.map((c) => {
                const value = m[c.key]
                const color = getMarketplaceColor(c.label)
                return (
                  <div
                    key={c.key}
                    className="w-full transition-all duration-500"
                    style={{ height: `${(value / m.total) * 100}%`, background: color, opacity: 0.85 }}
                  />
                )
              })}
            </div>
            <span className="text-[10px] text-text-muted">{m.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
