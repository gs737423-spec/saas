import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { VtexActiveSync } from '@/contexts/ConnectionContext'

const STAGE_STEPS = [
  { key: 'connection', label: 'Conexão', stages: ['queued', 'validate', 'categories'] },
  { key: 'catalog', label: 'Produtos e estoque', stages: ['catalog'] },
  { key: 'orders', label: 'Pedidos', stages: ['orders'] },
  { key: 'finalize', label: 'Finalizando', stages: ['finalize', 'complete'] },
] as const

const STAGE_ORDER: string[] = STAGE_STEPS.flatMap((step) => step.stages)

function stepStatus(stepStages: readonly string[], currentStage: string): 'done' | 'active' | 'pending' {
  if (stepStages.includes(currentStage)) return 'active'
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  const stepIndex = STAGE_ORDER.indexOf(stepStages[0])
  if (currentIndex === -1 || stepIndex === -1) return 'pending'
  return currentIndex > stepIndex ? 'done' : 'pending'
}

const STAGE_COPY: Record<string, string> = {
  queued: 'Na fila',
  validate: 'Validando credenciais',
  categories: 'Importando categorias',
  catalog: 'Importando produtos e estoque',
  orders: 'Importando pedidos',
  finalize: 'Calculando indicadores',
  complete: 'Concluída',
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${fmt(start)} — ${fmt(end)}`
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 45_000) return 'agora'
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.round(minutes / 60)
  return `há ${hours}h`
}

/** Painel de sincronização VTEX em andamento — barra real (determinada
 *  quando o backend sabe o total, indeterminada quando não sabe — nunca
 *  progresso fake por timer, ver computeVtexSyncProgress no backend),
 *  timeline de estágios e contadores reais. */
export default function VtexSyncProgressPanel({ activeSync, onResume }: { activeSync: VtexActiveSync; onResume?: () => void }) {
  const { stage, progress, counts, history, lastHeartbeatAt, isStale, state } = activeSync
  // Fonte única de verdade: o estado derivado no backend. `isStale` é
  // mantido só como fallback para respostas de status antigas em cache.
  const needsAttention = state ? state === 'requires_attention' : isStale
  const range = formatDateRange(history.start, history.end)
  const orders = counts.ordersFetched ?? 0
  const products = counts.productsFetched ?? 0
  const inventory = counts.inventoriesFetched ?? 0
  const catalogDone = STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf('catalog')
  const ordersDone = STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf('orders')

  if (needsAttention) {
    return (
      <div className="mt-3 rounded-lg border border-accent-amber/25 bg-accent-amber/8 p-3">
        <p className="text-[12px] font-medium text-text-primary">Sincronização interrompida</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-text-secondary">A VTEX demorou mais do que o esperado para responder. Seu progresso foi salvo.</p>
        {onResume && (
          <button type="button" onClick={onResume} className="control-active mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold">
            Continuar sincronização
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-border-subtle bg-bg-card/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">{STAGE_COPY[stage] ?? stage}</span>
        <span className="flex items-center gap-1 text-[10px] text-text-muted"><Loader2 className="h-3 w-3 animate-spin" />Última atividade: {timeAgo(lastHeartbeatAt)}</span>
      </div>

      {range && stage === 'orders' && <p className="mt-1 text-[10.5px] text-text-muted">Período: {range}</p>}

      {/* Timeline de estágios */}
      <div className="mt-3 flex items-center gap-1.5" role="list" aria-label="Etapas da sincronização">
        {STAGE_STEPS.map((step, index) => {
          const status = stepStatus(step.stages, stage)
          return (
            <div key={step.key} className="flex flex-1 items-center gap-1.5" role="listitem">
              <div className="flex flex-col items-center gap-1">
                {status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-emerald" />
                ) : status === 'active' ? (
                  <span className="vtex-stage-dot vtex-stage-dot--active flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-primary" aria-current="step">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                ) : (
                  <Circle className="vtex-stage-dot h-4 w-4 shrink-0 text-text-muted/50" />
                )}
                <span className={`hidden text-center text-[9px] leading-tight sm:block ${status === 'pending' ? 'text-text-muted' : 'text-text-secondary'}`}>{step.label}</span>
              </div>
              {index < STAGE_STEPS.length - 1 && <span className="h-px flex-1 bg-border-subtle" aria-hidden="true" />}
            </div>
          )
        })}
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <div
          className="vtex-progress-track"
          role="progressbar"
          aria-label={STAGE_COPY[stage] ?? 'Sincronizando'}
          aria-valuenow={progress.percent ?? undefined}
          aria-valuemin={progress.percent !== null ? 0 : undefined}
          aria-valuemax={progress.percent !== null ? 100 : undefined}
        >
          {progress.percent !== null ? (
            <div className="vtex-progress-fill" style={{ width: `${progress.percent}%` }} />
          ) : (
            <div className="vtex-progress-fill vtex-progress-fill--indeterminate" />
          )}
        </div>
        {progress.percent !== null && (
          <p className="mt-1 text-right text-[10px] font-medium tabular-nums text-text-muted">
            {progress.total
              ? `${progress.processed.toLocaleString('pt-BR')} de ${progress.total.toLocaleString('pt-BR')} · ${progress.percent}%`
              // basis 'time_window': percent é do PERÍODO varrido, não da
              // quantidade de pedidos — nunca junta com "X de Y" pra não
              // implicar que é fração de uma contagem conhecida.
              : `${progress.percent}% do período`}
          </p>
        )}
      </div>

      {/* Contadores */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
        <div>
          <p className="font-semibold tabular-nums text-text-primary">{orders.toLocaleString('pt-BR')}</p>
          <p className="text-[9.5px] text-text-muted">Pedidos</p>
        </div>
        <div>
          <p className={`font-semibold tabular-nums ${catalogDone || products > 0 ? 'text-text-primary' : 'text-text-muted'}`}>{catalogDone || products > 0 ? products.toLocaleString('pt-BR') : 'Aguardando'}</p>
          <p className="text-[9.5px] text-text-muted">Produtos</p>
        </div>
        <div>
          <p className={`font-semibold tabular-nums ${catalogDone || inventory > 0 ? 'text-text-primary' : 'text-text-muted'}`}>{catalogDone || inventory > 0 ? inventory.toLocaleString('pt-BR') : 'Aguardando'}</p>
          <p className="text-[9.5px] text-text-muted">Estoque</p>
        </div>
      </div>
      {ordersDone && <span className="sr-only" aria-live="polite">Pedidos concluídos, finalizando sincronização.</span>}
    </div>
  )
}
