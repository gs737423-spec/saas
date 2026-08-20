import type { VtexSyncCheckpoint, VtexSyncCounts } from './types.js'

export interface VtexSyncProgress {
  /** null = indeterminado — nunca inventa um número quando não há base real
   *  pra calcular (ver regra do produto: sem progresso falso por timer). */
  percent: number | null
  processed: number
  total: number | null
  /** Base do cálculo de `percent`:
   *  - `count`: fração de uma quantidade conhecida (ex.: skuOffset/skuTotal
   *    no catálogo) — `percent` representa proporcionalmente `processed`.
   *  - `time_window`: fração do intervalo de histórico (datas) já varrido —
   *    NÃO é proporcional a `processed` (a contagem real de pedidos no
   *    histórico é desconhecida até terminar). O consumidor não deve rotular
   *    esse percent como "X% dos pedidos".
   *  - `none`: sem base numérica (percent sempre null). */
  basis: 'count' | 'time_window' | 'none'
}

const STAGE_WEIGHTS: Record<string, number> = {
  queued: 0, validate: 0.02, categories: 0.05, catalog: 0.35, orders: 0.85, finalize: 0.97, complete: 1,
}

/** Progresso REAL por estágio — nunca por decorrer de tempo:
 *  - catalog: fração de SKUs processados (skuOffset/skuTotal), ambos
 *    conhecidos de verdade pelo checkpoint.
 *  - orders: fração do INTERVALO de histórico pedido (3/6 meses) já coberta
 *    por janelas de 7 dias concluídas — não é contagem de pedidos (o total
 *    de pedidos só é conhecido janela a janela, nunca globalmente antes de
 *    terminar), mas é uma medida real de quanto do período-alvo já foi
 *    varrido, calculável a qualquer momento a partir de datas que o
 *    checkpoint já guarda.
 *  Estágios sem base numérica (validate/finalize) ficam indeterminados. */
export function computeVtexSyncProgress(stage: string, checkpoint: VtexSyncCheckpoint | null | undefined, counts: Partial<VtexSyncCounts> | null | undefined): VtexSyncProgress {
  const cp = checkpoint ?? {}
  const c = counts ?? {}

  if (stage === 'catalog' && cp.skuTotal && cp.skuTotal > 0) {
    const processed = Math.min(cp.skuOffset ?? 0, cp.skuTotal)
    return { percent: Math.round((processed / cp.skuTotal) * 100), processed, total: cp.skuTotal, basis: 'count' }
  }

  if (stage === 'orders' && cp.orderHistoryStart && cp.orderTargetEnd) {
    const start = Date.parse(cp.orderBackfillFloor ?? cp.orderHistoryStart)
    const end = Date.parse(cp.orderTargetEnd)
    const covered = cp.orderTraversal === 'recent_first'
      ? end - Date.parse(cp.orderWindowEnd ?? cp.orderTargetEnd)
      : Date.parse(cp.orderWindowStart ?? cp.orderHistoryStart) - start
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && Number.isFinite(covered)) {
      const percent = Math.min(100, Math.max(0, Math.round((covered / (end - start)) * 100)))
      // basis 'time_window': percent é fração do PERÍODO já varrido, não da
      // quantidade de pedidos — o total real de pedidos só é conhecido ao
      // final. `processed` (contagem real) é reportado separadamente.
      return { percent, processed: c.ordersFetched ?? 0, total: null, basis: 'time_window' }
    }
  }

  return { percent: null, processed: c.ordersFetched ?? c.skusFetched ?? 0, total: null, basis: 'none' }
}

/** Peso aproximado do estágio no progresso global (0-1) — só usado se o
 *  frontend quiser uma barra única "sincronização geral" em vez de uma por
 *  estágio. Nunca chega em 1 (100%) antes do status virar `success`. */
export function vtexStageWeight(stage: string): number {
  return STAGE_WEIGHTS[stage] ?? 0
}
