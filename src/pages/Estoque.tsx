import { useEffect, useState } from 'react'
import { Loader2, Database, Settings, Info } from 'lucide-react'
import InventoryKPIs from '@/components/estoque/InventoryKPIs'
import InventoryTable from '@/components/estoque/InventoryTable'
import RealInventoryTable from '@/components/estoque/RealInventoryTable'
import { defaultInventoryFilters, type InventoryFilterState } from '@/components/estoque/InventoryFilters'
import type { DashboardInventoryResponse } from '@/server/integrations/types'

const badgeConfig = {
  real: { label: 'Dados reais', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/25', icon: Database },
  demo: { label: 'Demonstração', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/25', icon: Info },
  config_missing: { label: 'Configuração pendente', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/25', icon: Settings },
} as const

export default function Estoque() {
  const [filters, setFilters] = useState<InventoryFilterState>(defaultInventoryFilters)
  const [inventory, setInventory] = useState<DashboardInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/inventory')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DashboardInventoryResponse | null) => {
        if (!cancelled) setInventory(data)
      })
      .catch(() => {
        if (!cancelled) setInventory(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const source = inventory?.source ?? 'demo'
  const cfg = badgeConfig[source]
  const Icon = cfg.icon
  const showRealTable = source === 'real' && inventory && inventory.items.length > 0

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-end">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
          {cfg.label}
        </span>
      </div>

      {source === 'config_missing' && (
        <div className="glass-panel rounded-2xl p-4 text-[12px] leading-relaxed text-text-secondary sm:p-5">
          Configuração pendente — adicione as credenciais do Mercado Livre na Vercel para ativar dados reais de estoque.
          Exibindo dados de demonstração abaixo.
        </div>
      )}

      {showRealTable ? (
        <RealInventoryTable items={inventory.items} />
      ) : (
        <>
          <InventoryKPIs filters={filters} onChange={setFilters} />
          <InventoryTable filters={filters} onChange={setFilters} />
        </>
      )}
    </div>
  )
}
