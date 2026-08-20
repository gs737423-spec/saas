import type { ReactElement } from 'react'
import { Store } from 'lucide-react'
import { LogoAmazon, LogoLojaPropria, LogoMagalu, LogoMercadoLivre, LogoShopee } from '@/site/logos'

/** Resolução de marca por CHAVE CANÔNICA, nunca por nome.
 *
 *  Antes, a logo era escolhida por string de display name (mapa
 *  `'Mercado Livre' -> LogoMercadoLivre`). Isso quebrava de duas formas:
 *  um canal renomeado pelo usuário perdia a marca, e um canal recém
 *  descoberto com nome parecido ("Canal VTEX AMAZON") pegava — ou não —
 *  a logo errada. A chave canônica é estável e é a mesma coisa que o banco
 *  usa em `sales_channels.canonical_key` / `logo_key`.
 *
 *  Canal ainda não identificado NÃO recebe logo emprestada nem imagem
 *  quebrada: recebe um ícone neutro explícito. */

const LOGO_BY_CANONICAL_KEY: Record<string, () => ReactElement> = {
  mercadolivre: LogoMercadoLivre,
  amazon: LogoAmazon,
  shopee: LogoShopee,
  magalu: LogoMagalu,
  loja_propria: LogoLojaPropria,
}

export const UNRESOLVED_CHANNEL_KEY = 'external:vtex:unmapped'

export function hasChannelLogo(canonicalKey: string | null | undefined): boolean {
  return Boolean(canonicalKey && LOGO_BY_CANONICAL_KEY[canonicalKey])
}

// A lista de chaves com marca é a mesma do registry canônico do backend
// (channelResolution.ts `logoKey`) — testada lá, sem depender de React.

/** Marca do canal em um contêiner circular padronizado. `size` em px.
 *  Sem logo conhecida (canal criado pelo usuário, ou não identificado) =
 *  ícone neutro, sempre — nunca `<img>` apontando para arquivo inexistente. */
export default function ChannelLogo({ canonicalKey, size = 24, label }: { canonicalKey: string | null | undefined; size?: number; label?: string }) {
  const Logo = canonicalKey ? LOGO_BY_CANONICAL_KEY[canonicalKey] : undefined
  const box = { width: size, height: size }
  if (!Logo) {
    return (
      <span
        role="img"
        aria-label={label ?? 'Canal sem marca identificada'}
        title={label ?? 'Canal sem marca identificada'}
        className="flex shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-primary text-text-muted"
        style={box}
      >
        <Store aria-hidden="true" style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    )
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full [&>img]:h-full [&>img]:w-full [&>svg]:h-full [&>svg]:w-full"
      style={box}
      title={label}
    >
      <Logo />
    </span>
  )
}
