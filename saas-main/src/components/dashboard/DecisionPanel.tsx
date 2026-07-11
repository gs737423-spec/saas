import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getExecutiveSummary,
  getExecutiveHighlights,
  getExecutiveAlerts,
  getMarketplaceColor,
  type ExecutiveHighlight,
} from '@/data/mockData'

const summaryDot: Record<string, string> = {
  neutral: '#4C82F7',
  positive: '#16C784',
  warning: '#F5C24B',
  danger: '#F4436C',
}

const highlightTone: Record<ExecutiveHighlight['tone'], string> = {
  emerald: '#16C784',
  violet: '#9061F9',
  blue: '#4C82F7',
  cyan: '#22D3EE',
  amber: '#F5C24B',
}

const alertTone: Record<string, string> = {
  danger: '#F4436C',
  warning: '#F5C24B',
  info: '#4C82F7',
}

export default function DecisionPanel() {
  const summary = getExecutiveSummary()
  const highlights = getExecutiveHighlights().slice(0, 3)
  const topAlert = getExecutiveAlerts()[0]

  return (
    <div className="overview-glass-elevated flex h-full flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/12" style={{ boxShadow: 'inset 0 0 0 1px rgba(144,97,249,0.25)' }}>
          <Sparkles className="h-4 w-4 text-accent-violet" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-text-primary">Painel de Decisão</h3>
          <p className="text-[11px] text-text-muted">Leitura de 10 segundos</p>
        </div>
      </div>

      {/* Executive summary — strong short lines */}
      <div className="space-y-2">
        {summary.map((l, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: summaryDot[l.tone], boxShadow: `0 0 7px ${summaryDot[l.tone]}99` }} />
            <p className="text-[13px] leading-snug text-text-secondary">{l.text}</p>
          </div>
        ))}
      </div>

      {/* Executive highlights */}
      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border-subtle pt-4">
        {highlights.map((h) => {
          const c = highlightTone[h.tone]
          const brand = getMarketplaceColor(h.channel)
          return (
            <div key={h.key} className="flex items-center justify-between gap-3 rounded-lg bg-bg-primary/30 px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{h.label}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                  <span className="truncate text-[12px] font-semibold text-text-primary">{h.channel}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[13px] font-bold" style={{ color: c }}>{h.value}</div>
                <div className="text-[9px] text-text-muted">{h.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Priority alert — action hook */}
      {topAlert && (
        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: `${alertTone[topAlert.severity]}33`, background: `${alertTone[topAlert.severity]}0F` }}>
          <div className="mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: alertTone[topAlert.severity] }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: alertTone[topAlert.severity] }}>
              {topAlert.rule}
            </span>
          </div>
          <p className="text-[12px] leading-snug text-text-secondary">{topAlert.message}</p>
        </div>
      )}

      <Link
        to="/marketplaces"
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/50 px-3 py-2 pt-2 text-[12px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
        style={{ marginTop: '1rem' }}
      >
        Ver análise completa dos canais
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
