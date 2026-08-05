import { LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLojaPropria } from '@/site/logos'

export type MarketplaceKey = 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria'

const MARKETPLACES: { key: MarketplaceKey; name: string; Logo: () => React.JSX.Element; ring: string }[] = [
  { key: 'mercadolivre', name: 'Mercado Livre', Logo: LogoMercadoLivre, ring: 'ring-[#FFE600]/70' },
  { key: 'shopee', name: 'Shopee', Logo: LogoShopee, ring: 'ring-[#EE4D2D]/70' },
  { key: 'amazon', name: 'Amazon', Logo: LogoAmazon, ring: 'ring-[#FF9900]/70' },
  { key: 'lojapropria', name: 'Loja Própria', Logo: LogoLojaPropria, ring: 'ring-accent-cyan/70' },
]

/**
 * Linha de logos de marketplace com 3 estados visuais:
 * - active (conectado de verdade): tile colorido, opacidade cheia.
 * - interest (só interesse declarado no lead, ainda não é integração): anel
 *   colorido da marca ao redor, tile com opacidade reduzida.
 * - none: grayscale opaco (nem conectado, nem de interesse).
 */
export default function MarketplaceRow({ active = [], interest = [], size = 'md' }: { active?: MarketplaceKey[]; interest?: MarketplaceKey[]; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? '[&>svg]:h-6 [&>svg]:w-6' : '[&>svg]:h-8 [&>svg]:w-8'
  return (
    <div className="flex items-center gap-2.5">
      {MARKETPLACES.map((mp) => {
        const isActive = active.includes(mp.key)
        const isInterest = !isActive && interest.includes(mp.key)
        return (
          <div
            key={mp.key}
            title={isActive ? `${mp.name} — conectado` : isInterest ? `${mp.name} — interesse declarado` : `${mp.name} — não conectado`}
            className={`rounded-lg ${dim} ${
              isActive ? '' : isInterest ? `opacity-70 ring-2 ${mp.ring}` : 'opacity-35 grayscale'
            }`}
          >
            <mp.Logo />
          </div>
        )
      })}
    </div>
  )
}
