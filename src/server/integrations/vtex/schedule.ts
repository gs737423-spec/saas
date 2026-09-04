import { VtexApiError } from './errors.js'

export const VTEX_AUTO_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000
export const VTEX_PERSISTENT_CIRCUIT_THRESHOLD = 5
export const VTEX_PERSISTENT_CIRCUIT_COOLDOWN_MS = 60 * 60 * 1000

export class VtexSyncNotDueError extends Error {
  constructor() {
    super('VTEX_SYNC_NOT_DUE')
    this.name = 'VtexSyncNotDueError'
  }
}

export function isVtexSyncDue(nextSyncAt: string | null | undefined, now = new Date()): boolean {
  if (!nextSyncAt) return true
  const timestamp = Date.parse(nextSyncAt)
  return Number.isFinite(timestamp) && timestamp <= now.getTime()
}

export function nextVtexSyncAt(now = new Date()): string {
  return new Date(now.getTime() + VTEX_AUTO_SYNC_INTERVAL_MS).toISOString()
}

export function getVtexCircuitRetryAfterMs(circuitOpenUntil: string | null | undefined, now = new Date()): number {
  if (!circuitOpenUntil) return 0
  const timestamp = Date.parse(circuitOpenUntil)
  if (!Number.isFinite(timestamp)) return 0
  return Math.max(0, timestamp - now.getTime())
}

export function assertVtexCircuitClosed(circuitOpenUntil: string | null | undefined, now = new Date()): void {
  const retryAfterMs = getVtexCircuitRetryAfterMs(circuitOpenUntil, now)
  if (retryAfterMs <= 0) return
  throw new VtexApiError('VTEX_CIRCUIT_OPEN', 'Persistent VTEX circuit breaker is open', 503, '/runtime/circuit-breaker', retryAfterMs)
}

export function nextVtexFailureState(currentFailureCount: number, now = new Date()): { failureCount: number; circuitOpenUntil: string | null } {
  const failureCount = Math.max(0, Number.isFinite(currentFailureCount) ? currentFailureCount : 0) + 1
  return {
    failureCount,
    circuitOpenUntil: failureCount >= VTEX_PERSISTENT_CIRCUIT_THRESHOLD
      ? new Date(now.getTime() + VTEX_PERSISTENT_CIRCUIT_COOLDOWN_MS).toISOString()
      : null,
  }
}
