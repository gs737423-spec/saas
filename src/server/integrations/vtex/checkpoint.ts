/** Checkpoint versionado + snapshot de configuração da run.
 *
 *  CAUSA RAIZ QUE ESTE ARQUIVO CORRIGE
 *  -----------------------------------
 *  Uma run criada quando o bootstrap buscava 12 meses foi recuperada por
 *  `reclaimStaleVtexRun` MUITO depois, já com a regra nova de 3 meses no
 *  código. O reclaim preservou o checkpoint cegamente e o estágio `orders`
 *  recalculou parte dos campos com a config ATUAL, produzindo uma
 *  combinação logicamente impossível: `orderWindowStart/End` de ago/2025 e
 *  `orderTargetEnd` de ago/2026 (regra velha) convivendo com
 *  `orderHistoryStart` de mai/2026 (regra nova) — historyStart DEPOIS da
 *  janela sendo varrida. `computeVtexSyncProgress` então calculava fração
 *  negativa e a run varria um período que ninguém pediu.
 *
 *  Duas correções estruturais:
 *
 *  1. VERSÃO — todo checkpoint carrega `version`. Checkpoint sem versão
 *     (todos os antigos) ou de versão diferente é MIGRADO explicitamente
 *     em vez de ter campos velhos e novos misturados em silêncio.
 *
 *  2. SNAPSHOT DE CONFIG — a configuração usada (historyMonths, tamanho da
 *     janela, modo) é gravada DENTRO do checkpoint quando a run é CRIADA e
 *     vale por toda a vida dela. Mudar a config do sistema no meio nunca
 *     mais reescreve as regras de uma run já em andamento; só vale para a
 *     próxima run nova.
 *
 *  Normalizar NUNCA apaga pedidos. Os pedidos já persistidos continuam
 *  onde estão — a idempotência (`canonical_order_key` único por company,
 *  upserts por external id) garante que revarrer um período já varrido não
 *  duplica nada. Checkpoint ruim é problema de ponteiro, não de dado.
 */

import type { VtexSyncCheckpoint } from './types.js'

export const VTEX_CHECKPOINT_VERSION = 2

export const VTEX_ORDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export interface VtexRunConfig {
  historyMonths: number
  windowMs: number
  syncMode: 'full' | 'incremental'
  checkpointVersion: number
}

export function buildVtexRunConfig(historyMonths: number, syncMode: 'full' | 'incremental'): VtexRunConfig {
  return { historyMonths, windowMs: VTEX_ORDER_WINDOW_MS, syncMode, checkpointVersion: VTEX_CHECKPOINT_VERSION }
}

/** Config efetiva da run: SEMPRE a do snapshot quando existe. O fallback
 *  só existe para runs criadas antes desta mudança (que não têm snapshot);
 *  nesse caso a config atual é adotada uma única vez e imediatamente
 *  congelada no checkpoint pela normalização abaixo. */
export function effectiveRunConfig(checkpoint: VtexSyncCheckpoint | null | undefined, fallback: VtexRunConfig): VtexRunConfig {
  const snapshot = checkpoint?.runConfig
  if (!snapshot) return fallback
  const historyMonths = Number(snapshot.historyMonths)
  const windowMs = Number(snapshot.windowMs)
  return {
    historyMonths: Number.isFinite(historyMonths) && historyMonths > 0 ? historyMonths : fallback.historyMonths,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : fallback.windowMs,
    syncMode: snapshot.syncMode === 'incremental' ? 'incremental' : snapshot.syncMode === 'full' ? 'full' : fallback.syncMode,
    checkpointVersion: Number(snapshot.checkpointVersion) || fallback.checkpointVersion,
  }
}

function parseDate(value: unknown): number | null {
  if (typeof value !== 'string' || !value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export interface VtexCheckpointNormalization {
  checkpoint: VtexSyncCheckpoint
  config: VtexRunConfig
  /** true = o checkpoint estava inconsistente/legado e foi reescrito. */
  normalized: boolean
  /** Motivos legíveis — vão para o log `checkpoint_normalized` e para o
   *  relatório de auditoria; nunca só "algo mudou". */
  reasons: string[]
}

/** Normaliza e valida invariantes do checkpoint ANTES de qualquer
 *  processamento. Um checkpoint logicamente impossível é recalculado a
 *  partir da config da própria run (snapshot), não da config atual do
 *  sistema — a run continua sendo a run que foi criada. */
export function normalizeVtexCheckpoint(
  raw: VtexSyncCheckpoint | null | undefined,
  fallbackConfig: VtexRunConfig,
  now: Date = new Date(),
): VtexCheckpointNormalization {
  const checkpoint: VtexSyncCheckpoint = { ...(raw ?? {}) }
  const reasons: string[] = []
  const hadVersion = typeof checkpoint.version === 'number'
  const config = effectiveRunConfig(checkpoint, fallbackConfig)

  if (!hadVersion) reasons.push('missing_version')
  else if (checkpoint.version !== VTEX_CHECKPOINT_VERSION) reasons.push(`version_${checkpoint.version}_to_${VTEX_CHECKPOINT_VERSION}`)
  if (!checkpoint.runConfig) reasons.push('missing_run_config')

  // Prova de validação de catálogo é ADITIVA e nunca inferida: checkpoint
  // sem `catalogStatus` (todo checkpoint legado, inclusive o caso real de
  // produção com `stage='orders'`/`skuTotal=NULL`/zero produtos) ganha
  // 'unknown' explicitamente aqui — nunca 'completed'. Isso é o que permite
  // a state machine em sync.ts decidir revalidar o catálogo sem depender de
  // `stage`, que pode ter sido herdado de uma execução anterior ao próprio
  // conceito de validação de catálogo existir.
  const validCatalogStatuses = ['unknown', 'validating', 'completed', 'empty', 'partial', 'blocked']
  if (!checkpoint.catalogStatus || !validCatalogStatuses.includes(checkpoint.catalogStatus)) {
    if (checkpoint.catalogStatus) reasons.push('invalid_catalog_status')
    else reasons.push('missing_catalog_status')
    checkpoint.catalogStatus = 'unknown'
  }

  // Ponteiros numéricos: nunca abaixo do mínimo válido.
  if (checkpoint.orderPage !== undefined && (!Number.isFinite(Number(checkpoint.orderPage)) || Number(checkpoint.orderPage) < 1)) {
    checkpoint.orderPage = 1
    reasons.push('order_page_out_of_range')
  }
  if (checkpoint.skuOffset !== undefined && (!Number.isFinite(Number(checkpoint.skuOffset)) || Number(checkpoint.skuOffset) < 0)) {
    checkpoint.skuOffset = 0
    reasons.push('sku_offset_out_of_range')
  }

  const targetEndDefault = now.getTime()
  const historyStartDefault = targetEndDefault - config.historyMonths * 30 * DAY_MS

  let historyStart = parseDate(checkpoint.orderHistoryStart)
  let targetEnd = parseDate(checkpoint.orderTargetEnd)
  let windowStart = parseDate(checkpoint.orderWindowStart)
  let windowEnd = parseDate(checkpoint.orderWindowEnd)

  const hasAnyOrderPointer = historyStart !== null || targetEnd !== null || windowStart !== null || windowEnd !== null
  if (hasAnyOrderPointer) {
    // Invariante central: historyStart <= windowStart < windowEnd <= targetEnd.
    // Qualquer violação (inclusive o caso real: historyStart de mai/2026 com
    // window de ago/2025 e target de ago/2026) invalida o intervalo inteiro,
    // porque não dá pra saber qual metade é a "certa" — os campos vieram de
    // regras diferentes. Recalculamos tudo a partir do snapshot da run.
    const invalid =
      historyStart === null || targetEnd === null || windowStart === null || windowEnd === null ||
      targetEnd <= historyStart ||
      windowStart < historyStart ||
      windowEnd <= windowStart ||
      windowEnd > targetEnd ||
      windowStart > targetEnd

    if (invalid) {
      reasons.push('impossible_order_window')
      historyStart = historyStartDefault
      targetEnd = targetEndDefault
      windowStart = historyStartDefault
      windowEnd = Math.min(historyStartDefault + config.windowMs, targetEndDefault)
      checkpoint.orderPage = 1
      checkpoint.orderHistoryStart = new Date(historyStart).toISOString()
      checkpoint.orderTargetEnd = new Date(targetEnd).toISOString()
      checkpoint.orderWindowStart = new Date(windowStart).toISOString()
      checkpoint.orderWindowEnd = new Date(windowEnd).toISOString()
    }
  }

  checkpoint.version = VTEX_CHECKPOINT_VERSION
  checkpoint.runConfig = {
    historyMonths: config.historyMonths,
    windowMs: config.windowMs,
    syncMode: config.syncMode,
    checkpointVersion: VTEX_CHECKPOINT_VERSION,
  }

  return { checkpoint, config, normalized: reasons.length > 0, reasons }
}

/** Gate único da state machine: decide se a run precisa (re)entrar no
 *  estágio `catalog` ANTES de continuar consumindo `orders`, baseado
 *  exclusivamente em `catalogStatus` normalizado — nunca em `stage`.
 *  `unknown` é o único estado que reentra; uma vez `completed`/`empty`/
 *  `blocked`, nunca mais reentra nesta run (evita loop eterno numa conta
 *  sem permissão de catálogo). `partial`/`validating` também não reentram
 *  por este gate porque nesses casos `stage` já está em `catalog` (a run
 *  foi yieldada no meio do próprio estágio) — o fluxo sequencial normal
 *  retoma o lote de onde parou sem precisar do gate. */
export function vtexCatalogNeedsRevalidation(checkpoint: VtexSyncCheckpoint | null | undefined): boolean {
  const status = checkpoint?.catalogStatus
  return status === undefined || status === 'unknown'
}

/** Estado único e coerente exposto pelo contrato de status. Existe porque
 *  a UI conseguia mostrar dois badges conflitantes ao mesmo tempo
 *  ("sincronizando" + "interrompida"): `status` e `isStale` eram derivados
 *  em lugares diferentes. Agora há UMA função e UM estado. */
export type VtexRunState =
  | 'queued'            // ainda não começou
  | 'running'           // processando agora, heartbeat fresco
  | 'yielded_queued'    // devolveu o controle por orçamento de tempo — normal
  | 'partial'
  | 'failed_recoverable'
  | 'requires_attention' // running sem heartbeat = travada de verdade
  | 'completed'

export function deriveVtexRunState(input: {
  status: string
  stage?: string | null
  lastHeartbeatAt?: string | null
  startedAt?: string | null
  errorCount?: number
  staleAfterMs: number
  now?: number
}): VtexRunState {
  const now = input.now ?? Date.now()
  switch (input.status) {
    case 'success':
      return 'completed'
    case 'partial':
      return 'partial'
    case 'failed':
      return 'failed_recoverable'
    case 'queued': {
      // `queued` com progresso já gravado é yield controlado (a run pausou
      // dentro do orçamento e espera o próximo tick do cron) — jamais um
      // alerta. `queued` sem nada processado ainda é fila de verdade.
      const started = Boolean(input.startedAt) || (input.stage !== undefined && input.stage !== null && !['queued', 'validate'].includes(input.stage))
      return started ? 'yielded_queued' : 'queued'
    }
    case 'running': {
      const heartbeat = input.lastHeartbeatAt ?? input.startedAt
      const heartbeatMs = heartbeat ? Date.parse(heartbeat) : NaN
      if (Number.isFinite(heartbeatMs) && now - heartbeatMs > input.staleAfterMs) return 'requires_attention'
      return 'running'
    }
    default:
      return 'queued'
  }
}

/** Estados em que a UI deve dizer "sincronizando normalmente". */
export const VTEX_ACTIVE_RUN_STATES: readonly VtexRunState[] = ['queued', 'running', 'yielded_queued']
