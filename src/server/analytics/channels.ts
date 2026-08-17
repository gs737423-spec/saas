export type StoredSalesChannel = string

export const SALES_CHANNEL_LABEL: Record<string, string> = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
  magalu: 'Magalu',
  loja_propria: 'Loja Própria',
  'external:vtex:unmapped': 'Canal VTEX não mapeado',
}

export function salesChannelDisplayName(channel: string, registeredName?: string | null): string {
  if (registeredName?.trim()) return registeredName.trim()
  if (SALES_CHANNEL_LABEL[channel]) return SALES_CHANNEL_LABEL[channel]
  if (channel.startsWith('external:vtex:')) return 'Outros canais'
  return channel.split(/[:_.-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Outros canais'
}

export function providerDefaultChannel(provider: string): StoredSalesChannel | null {
  if (provider === 'mercadolivre' || provider === 'shopee' || provider === 'amazon' || provider === 'magalu' || provider === 'loja_propria') return provider
  return null
}
