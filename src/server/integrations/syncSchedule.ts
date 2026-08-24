const MIN_INTERVAL_MINUTES = 5
const MAX_INTERVAL_MINUTES = 7 * 24 * 60
const MAX_RETRY_MINUTES = 6 * 60

function boundedMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(MAX_INTERVAL_MINUTES, Math.max(MIN_INTERVAL_MINUTES, Math.floor(value)))
}

export function nextScheduledSyncAt(syncIntervalMinutes: number, now = new Date()): string {
  return new Date(now.getTime() + boundedMinutes(syncIntervalMinutes, 60) * 60_000).toISOString()
}

export function nextIntegrationFailureState(previousFailureCount: number, now = new Date()): {
  failureCount: number
  nextSyncAt: string
  circuitOpenUntil: string | null
} {
  const failureCount = Math.max(0, Math.floor(previousFailureCount || 0)) + 1
  const retryMinutes = Math.min(MAX_RETRY_MINUTES, 5 * 2 ** Math.min(failureCount - 1, 8))
  const nextSyncAt = new Date(now.getTime() + retryMinutes * 60_000).toISOString()
  return {
    failureCount,
    nextSyncAt,
    circuitOpenUntil: failureCount >= 5 ? nextSyncAt : null,
  }
}
