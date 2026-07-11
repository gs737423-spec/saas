import { stockItems, type StockItem } from '@/data/mockData'

const statusColor: Record<StockItem['status'], string> = {
  ok: '#16C784',
  low: '#F5C24B',
  critical: '#F4436C',
  stalled: '#9061F9',
}

const ranked = [...stockItems].sort((a, b) => b.turnover - a.turnover)
const maxTurnover = Math.max(...ranked.map((s) => s.turnover))

export default function GiroEstoqueChart() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Giro de Estoque</h3>
          <p className="mt-0.5 text-xs text-text-muted">Unidades vendidas / estoque médio · por produto</p>
        </div>
        <div className="hidden items-center gap-3 text-[10px] text-text-secondary sm:flex">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#16C784]" />Saudável</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F5C24B]" />Baixo</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F4436C]" />Crítico</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9061F9]" />Parado</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {ranked.map((s) => {
          const color = statusColor[s.status]
          const fillPct = (s.turnover / maxTurnover) * 100
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[12px] text-text-secondary sm:w-40">{s.name}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-bg-primary/70 ring-1 ring-inset ring-border-subtle">
                <div
                  className="flex h-full items-center rounded-md transition-all duration-500"
                  style={{ width: `${fillPct}%`, background: `linear-gradient(90deg, ${color}55, ${color})`, boxShadow: `0 0 12px -3px ${color}66` }}
                >
                  <span className="ml-auto pr-2 font-mono text-[10px] font-bold text-[#04101c]">{s.turnover}x</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
