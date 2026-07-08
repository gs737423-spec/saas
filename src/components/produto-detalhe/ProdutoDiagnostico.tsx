import { TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { ProductInsight } from '@/data/mockData'

const toneConfig: Record<ProductInsight['tone'], { icon: typeof TrendingUp; color: string; bg: string; border: string }> = {
  positive: { icon: TrendingUp, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  warning: { icon: AlertTriangle, color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  danger: { icon: ShieldAlert, color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
}

const severityBadge: Record<ProductInsight['severity'], string> = {
  'Crítico': 'bg-accent-rose/15 text-accent-rose',
  'Atenção': 'bg-accent-amber/15 text-accent-amber',
  'Oportunidade': 'bg-accent-cyan/15 text-accent-cyan',
  'Saudável': 'bg-accent-emerald/15 text-accent-emerald',
}

export default function ProdutoDiagnostico({ insights }: { insights: ProductInsight[] }) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Diagnóstico do Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">Insights automáticos, priorizados por urgência</p>
      </div>
      <div className="space-y-2.5">
        {insights.map((ins) => {
          const cfg = toneConfig[ins.tone]
          const Icon = cfg.icon
          return (
            <div key={ins.label} className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5`}>
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary ${cfg.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-text-primary">{ins.label}</span>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${severityBadge[ins.severity]}`}>{ins.severity}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary">{ins.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
