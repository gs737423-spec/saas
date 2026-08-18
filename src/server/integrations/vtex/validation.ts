const ACCOUNT_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/
const CREDENTIAL_MAX_LENGTH = 4096
const CHANNEL_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,64}$/
const CANONICAL_CHANNEL_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,159}$/
const DISPLAY_NAME_MAX_LENGTH = 160
const EXTERNAL_KEY_MAX_LENGTH = 320

export function normalizeVtexAccountName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('VTEX_INVALID_ACCOUNT')
  const normalized = value.trim().toLowerCase()
  if (!ACCOUNT_NAME_PATTERN.test(normalized)) throw new Error('VTEX_INVALID_ACCOUNT')
  if (normalized === 'localhost' || /^\d+(?:\.\d+){3}$/.test(normalized)) throw new Error('VTEX_INVALID_ACCOUNT')
  return normalized
}

export function validateVtexCredential(value: unknown, field: 'appKey' | 'appToken'): string {
  if (typeof value !== 'string') throw new Error(`VTEX_INVALID_${field === 'appKey' ? 'APP_KEY' : 'APP_TOKEN'}`)
  const normalized = value.trim()
  if (!normalized || normalized.length > CREDENTIAL_MAX_LENGTH || /[\r\n]/.test(normalized)) {
    throw new Error(`VTEX_INVALID_${field === 'appKey' ? 'APP_KEY' : 'APP_TOKEN'}`)
  }
  return normalized
}

export function buildVtexBaseUrl(accountName: string): string {
  const safeAccount = normalizeVtexAccountName(accountName)
  return `https://${safeAccount}.vtexcommercestable.com.br`
}

export function sanitizeVtexPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || /https?:|\\|[\r\n]/i.test(path)) throw new Error('VTEX_INVALID_PATH')
  return path
}

export function normalizeVtexChannelMappings(value: unknown): Record<string, string[]> {
  const input = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const entries = Object.entries(input)
  if (entries.length > 100) throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  const result: Record<string, string[]> = {}
  let totalExternalIds = 0
  for (const [rawCanonicalChannel, raw] of entries) {
    const canonicalChannel = rawCanonicalChannel.trim().toLowerCase()
    if (!CANONICAL_CHANNEL_PATTERN.test(canonicalChannel) || ['__proto__', 'prototype', 'constructor'].includes(canonicalChannel)) {
      throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
    }
    if (raw === undefined) continue
    if (!Array.isArray(raw) || raw.length > 50) throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
    const values = raw.map((item) => typeof item === 'string' ? item.trim() : '')
    if (values.some((item) => !CHANNEL_ID_PATTERN.test(item))) throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
    const normalized = [...new Set(values.map((item) => item.toLowerCase()))]
    totalExternalIds += normalized.length
    if (totalExternalIds > 500) throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
    result[canonicalChannel] = normalized
  }
  return result
}

/** 3 meses é o padrão (primeira carga rápida); 6 é o teto oferecido na UI.
 *  Qualquer outro valor cai no padrão em vez de rejeitar a requisição —
 *  histórico inicial é uma preferência, não algo que deva quebrar o
 *  connect por um valor mal formado. */
export function normalizeVtexHistoryMonths(value: unknown): 3 | 6 {
  return value === 6 || value === '6' ? 6 : 3
}

export function normalizeVtexCanonicalChannel(value: unknown): string {
  if (typeof value !== 'string') throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  const normalized = value.trim().toLowerCase()
  if (!CANONICAL_CHANNEL_PATTERN.test(normalized) || ['__proto__', 'prototype', 'constructor'].includes(normalized)) {
    throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  }
  return normalized
}

export function normalizeVtexChannelDisplayName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/g, '')
  if (!normalized || normalized.length > DISPLAY_NAME_MAX_LENGTH) throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  return normalized
}

export function normalizeVtexExternalChannelKey(value: unknown): string {
  if (typeof value !== 'string') throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  const normalized = value.trim()
  if (!normalized || normalized.length > EXTERNAL_KEY_MAX_LENGTH || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error('VTEX_INVALID_CHANNEL_MAPPING')
  }
  return normalized
}
