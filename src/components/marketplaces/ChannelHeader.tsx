import { RefreshCw } from 'lucide-react'
import { channelDataSignals, lastUpdatedLabel, getMarketplaceColor, type DataSignalStatus } from '@/data/mockData'

const periods = ['30 dias', '90 dias', '12 meses'] as const

function signalColor(status: DataSignalStatus, mp: string): string {
  if (status === 'ok') return getMarketplaceColor(mp as any)
  if (status === 'pendente') return '#F5C24B'
  return '#59688A'
}

export default function ChannelHeader() {
  return (
    <div className="overview-glass flex flex-col gap-3 rounded-xl px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <RefreshCw className="h-3 w-3" />
          Dados
        </span>
        {channelDataSignals.map((s) => (
          <span key={s.marketplace} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: signalColor(s.status, s.marketplace),
                boxShadow: s.status === 'ok' ? `0 0 7px ${signalColor(s.status, s.marketplace)}88` : 'none',
                opacity: s.status === 'nao_conectado' ? 0.5 : 1,
              }}
            />
            <span className={s.status === 'nao_conectado' ? 'text-text-muted' : ''}>{s.marketplace}</span>
            {s.status !== 'ok' && <span className="hidden text-[10px] text-text-muted sm:inline">· {s.label}</span>}
          </span>
        ))}
        <span className="text-[11px] text-text-muted">· atualizado {lastUpdatedLabel}</span>
      </div>

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
