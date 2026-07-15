import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FinanceTransaction, FinanceTransactionType } from '@/data/financeData'
import { getMarketplaceColor } from '@/data/mockData'
import DataTableViewport from '@/components/common/DataTableViewport'

const brl = (v: number) => Math.round(v).toLocaleString('pt-BR')

const typeTone: Record<FinanceTransactionType, string> = {
  Venda: '#16C784',
  Comissão: '#F5C24B',
  Tarifa: '#F5C24B',
  Estorno: '#F4436C',
  Devolução: '#F4436C',
  Ajuste: '#59688A',
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

export default function TransactionsLedger({ transactions }: { transactions: FinanceTransaction[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-panel motion-panel rounded-2xl p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="motion-chip flex w-full cursor-pointer items-center justify-between gap-2"
      >
        <div className="text-left">
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Movimentações Financeiras</h3>
          <p className="mt-0.5 text-xs text-text-muted">{transactions.length} lançamentos · vendas, comissão, estornos e ajustes</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4">
          <DataTableViewport size="large" ariaLabel="Movimentações financeiras. Use as setas ou role para visualizar mais registros." className="-mx-1 rounded-xl px-1">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-4 font-semibold">Data</th>
                  <th className="pb-3 pr-4 font-semibold">Marketplace</th>
                  <th className="pb-3 pr-4 font-semibold">Tipo</th>
                  <th className="pb-3 pr-4 font-semibold">Identificação</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Bruto</th>
                  <th className="pb-3 pr-4 text-center font-semibold">Desconto</th>
                  <th className="pb-3 text-center font-semibold">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => {
                  const brand = getMarketplaceColor(t.marketplace)
                  return (
                    <tr key={i} className="motion-row border-b border-border-subtle/50 hover:border-border-default/70 hover:bg-bg-card-hover/50">
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-text-muted">{formatDate(t.date)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                          <span className="text-[12.5px] text-text-secondary">{t.marketplace}</span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: `${typeTone[t.type]}18`, color: typeTone[t.type] }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-text-muted">{t.identifier}</td>
                      <td className="py-2.5 pr-4 text-center font-mono text-text-secondary">R$ {brl(t.gross)}</td>
                      <td className="py-2.5 pr-4 text-center font-mono text-text-muted">R$ {brl(t.discount)}</td>
                      <td className={`py-2.5 text-center font-mono font-medium ${t.net >= 0 ? 'text-text-primary' : 'text-accent-rose'}`}>
                        R$ {brl(t.net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableViewport>
        </div>
      )}
    </div>
  )
}
