// Base da área autenticada da plataforma. O site institucional vive em `/`,
// portanto todo o dashboard foi movido para baixo de `/app`. Centralizado aqui
// para que links internos não fiquem espalhados como strings mágicas.
export const APP_BASE = '/app'

export const appPath = (sub = ''): string => (sub ? `${APP_BASE}/${sub.replace(/^\//, '')}` : APP_BASE)

export const productPath = (sku: string): string => `${APP_BASE}/produto/${sku}`
