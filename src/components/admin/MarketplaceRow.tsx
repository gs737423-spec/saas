import { LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLojaPropria } from '@/site/logos'

export type MarketplaceKey = 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria'

const MARKETPLACES: { key: MarketplaceKey; name: string; Logo: () => React.JSX.Element; ring: string }[] = [
  { key: 'mercadolivre', name: 'Mercado Livre', Logo: LogoMercadoLivre, ring: 'ring-[#FFE600]/70' },
  { key: 'shopee', name: 'Shopee', Logo: LogoShopee, ring: 'ring-[#EE4D2D]/70' },
  { key: 'amazon', name: 'Amazon', Logo: LogoAmazon, ring: 'ring-[#FF9900]/70' },
  { key: 'lojapropria', name: 'Loja Própria', Logo: LogoLojaPropria, ring: 'ring-accent-primary/70' },
]

/**
 * Linha de logos de marketplace — sempre em círculo padronizado
 * (w-8 h-8 / w-6 h-6), 3 estados visuais:
 * - active (conectado de verdade): cor cheia da marca.
 * - interest (só interesse declarado no lead, ainda não é integração): anel
 *   colorido da marca ao redor, opacidade reduzida.
 * - none: grayscale opaco (nem conectado, nem de interesse).
 */
export default function MarketplaceRow({ active = [], interest = [], size = 'md' }: { active?: MarketplaceKey[]; interest?: MarketplaceKey[]; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  return (
    <div className="flex items-center gap-2">
      {MARKETPLACES.map((mp) => {
        const isActive = active.includes(mp.key)
        const isInterest = !isActive && interest.includes(mp.key)
        return (
          <div
            key={mp.key}
            title={isActive ? `${mp.name} — conectado` : isInterest ? `${mp.name} — interesse declarado` : `${mp.name} — não conectado`}
            className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full [&>img]:h-full [&>img]:w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:rounded-none ${
              isActive ? '' : isInterest ? `opacity-75 ring-2 ${mp.ring}` : 'opacity-35 grayscale'
            }`}
          >
            <mp.Logo />
          </div>
        )
      })}
    </div>
  )
}
