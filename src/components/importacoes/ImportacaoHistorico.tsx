import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { importHistory, getMarketplaceColor } from '@/data/mockData'

const statusConfig = {
  sucesso: { icon: CheckCircle2, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', label: 'Sucesso' },
  erro: { icon: XCircle, color: 'text-accent-rose', bg: 'bg-accent-rose/10', label: 'Erro' },
  processando: { icon: Loader2, color: 'text-accent-amber', bg: 'bg-accent-amber/10', label: 'Processando' },
}

export default function ImportacaoHistorico() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Histórico de Importações</h3>
        <p className="mt-0.5 text-xs text-text-muted">Formatos aceitos: .xlsx, .xls, .csv</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {importHistory.map((r) => {
          const cfg = statusConfig[r.status]
          const Icon = cfg.icon
          const mp = getMarketplaceColor(r.marketplace)
          return (
            <div key={r.id} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] text-text-primary">{r.fileName}</p>
                  <span className="mt-0.5 text-[11px] text-text-muted">{r.date}</span>
                </div>
                <span className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${mp}15`, color: mp }}>{r.marketplace}</span>
                <span className="text-text-muted">{r.rows} linhas</span>
                {r.errors ? <span className="text-accent-rose">{r.errors} erros de validação</span> : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4 font-semibold">Arquivo</th>
              <th className="pb-3 pr-4 font-semibold">Marketplace</th>
              <th className="pb-3 pr-4 font-semibold">Data</th>
              <th className="pb-3 pr-4 text-right font-semibold">Linhas</th>
              <th className="pb-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.map((r) => {
              const cfg = statusConfig[r.status]
              const Icon = cfg.icon
              const mp = getMarketplaceColor(r.marketplace)
              return (
                <tr key={r.id} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-4 font-mono text-[12px] text-text-primary">{r.fileName}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {r.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">{r.date}</td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{r.rows}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg.color} ${cfg.bg}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}{r.errors ? ` · ${r.errors} erros` : ''}
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
