export type VtexErrorCode =
  | 'VTEX_INVALID_CREDENTIALS'
  | 'VTEX_PERMISSION_REQUIRED'
  | 'VTEX_RATE_LIMITED'
  | 'VTEX_UNAVAILABLE'
  | 'VTEX_VALIDATION_ERROR'
  | 'VTEX_CIRCUIT_OPEN'

export class VtexApiError extends Error {
  constructor(public code: VtexErrorCode, message: string, public status: number, public path: string, public retryAfterMs: number | null = null) {
    super(message)
    this.name = 'VtexApiError'
  }
}

export function publicVtexError(error: unknown): { code: VtexErrorCode; message: string } {
  if (!(error instanceof VtexApiError)) {
    if (error instanceof Error && error.message.startsWith('VTEX_INVALID_')) {
      return { code: 'VTEX_VALIDATION_ERROR', message: 'Os dados informados para o mapeamento VTEX são inválidos.' }
    }
    return { code: 'VTEX_UNAVAILABLE', message: 'A VTEX está temporariamente indisponível. Tente novamente.' }
  }
  if (error.code === 'VTEX_CIRCUIT_OPEN') {
    const minutes = Math.max(1, Math.ceil((error.retryAfterMs ?? 0) / 60_000))
    return { code: error.code, message: `Sincronização temporariamente pausada após falhas consecutivas. Tente novamente em ${minutes} minuto${minutes === 1 ? '' : 's'}.` }
  }
  if (error.code === 'VTEX_INVALID_CREDENTIALS') return { code: error.code, message: 'A credencial VTEX é inválida ou expirou.' }
  if (error.code === 'VTEX_PERMISSION_REQUIRED') return { code: error.code, message: 'Credencial válida, mas faltam permissões para concluir a integração.' }
  if (error.code === 'VTEX_RATE_LIMITED') return { code: error.code, message: 'A VTEX limitou temporariamente as requisições. A sincronização poderá continuar depois.' }
  if (error.code === 'VTEX_VALIDATION_ERROR') return { code: error.code, message: 'Os dados informados para a conexão VTEX são inválidos.' }
  return { code: error.code, message: 'A VTEX está temporariamente indisponível. Os dados já sincronizados foram preservados.' }
}
