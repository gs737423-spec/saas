// WhatsApp de suporte — número e mensagens vêm de env vars (VITE_WHATSAPP_*),
// nunca hardcoded em componentes. Sem número configurado, retorna null: quem
// consome isso deve ocultar o botão em vez de apontar para link falso/vazio.
const NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, '')

const ACCESS_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_ACCESS_MESSAGE as string | undefined) ||
  'Olá! Sou cliente da Acelera Intelligence e preciso de ajuda para acessar a plataforma.'

const DEMO_MESSAGE =
  (import.meta.env.VITE_WHATSAPP_DEMO_MESSAGE as string | undefined) ||
  'Olá! Gostaria de conhecer a plataforma Acelera Intelligence e solicitar uma demonstração.'

export const whatsappConfigured = !!NUMBER

function buildUrl(message: string): string | null {
  if (!NUMBER) return null
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`
}

/** Link de suporte — ajuda com acesso à plataforma (nunca inclui senha, token ou dados da sessão). */
export function whatsappAccessHelpUrl(): string | null {
  return buildUrl(ACCESS_MESSAGE)
}

/** Link comercial — solicitar demonstração. */
export function whatsappDemoUrl(): string | null {
  return buildUrl(DEMO_MESSAGE)
}
