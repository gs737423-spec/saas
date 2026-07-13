import { useState } from 'react'
import ExecutiveHeader from '@/components/dashboard/ExecutiveHeader'
import KPICards from '@/components/dashboard/KPICards'
import MarketplaceComparison from '@/components/dashboard/MarketplaceComparison'
import DecisionPanel from '@/components/dashboard/DecisionPanel'
import { buildPeriodOptions, DEFAULT_PERIOD_KEY } from '@/lib/periods'

const periodOptions = buildPeriodOptions()

export default function Dashboard() {
  const [periodKey, setPeriodKey] = useState(DEFAULT_PERIOD_KEY)
  const period = periodOptions.find((p) => p.key === periodKey) ?? periodOptions[0]

  return (
    <div className="space-y-3.5">
      {/* Faixa compacta: período + status dos canais */}
      <ExecutiveHeader options={periodOptions} selectedKey={periodKey} onChange={setPeriodKey} />

      {/* KPIs com hierarquia: hero Líquido + secundários + Taxas (atenção) */}
      <KPICards period={period} />

      {/* Dobra central: comparativo (coração) + painel de decisão */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[2fr_1fr]">
        <MarketplaceComparison />
        <DecisionPanel />
      </div>

      {/* E5, E6, E7 (produtos em atenção, gráfico bruto vs líquido, alertas completos)
          entram após aprovação desta prévia. */}
    </div>
  )
}
