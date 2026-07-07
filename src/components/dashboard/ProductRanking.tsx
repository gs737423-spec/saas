import { TrendingUp, TrendingDown } from 'lucide-react'
import { products, getMarketplaceColor } from '@/data/mockData'

export default function ProductRanking() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Ranking de Produtos</h3>
          <p className="text-sm text-text-muted">Top 10 por receita — últimos 30 dias</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Produto</th>
              <th className="pb-3 pr-4">Marketplace</th>
              <th className="pb-3 pr-4 text-right">Receita</th>
              <th className="pb-3 pr-4 text-right">Unidades</th>
              <th className="pb-3 pr-4 text-right">Margem</th>
              <th className="pb-3 text-right">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const positive = p.trend >= 0
              return (
                <tr
                  key={p.id}
                  className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover"
                >
                  <td className="py-3 pr-4 font-mono text-text-muted">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3 pr-4 font-medium text-text-primary">{p.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        background: `${getMarketplaceColor(p.marketplace)}15`,
                        color: getMarketplaceColor(p.marketplace),
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: getMarketplaceColor(p.marketplace) }}
                      />
                      {p.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-medium text-text-primary">
                    R$ {p.revenue.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">
                    {p.units.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-subtle">
                        <div
                          className="h-full rounded-full bg-accent-emerald"
                          style={{ width: `${p.margin}%` }}
                        />
                      </div>
                      <span className="font-mono text-text-secondary">{p.margin}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono font-medium ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {positive ? '+' : ''}{p.trend}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
