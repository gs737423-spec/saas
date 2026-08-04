/* Marcas dos marketplaces — ícones SVG quadrados, cores oficiais, SEM texto
   embutido. O nome de cada marca é sempre renderizado como texto HTML pelo
   componente consumidor (marquee, grade de integrações); embutir o wordmark
   dentro do SVG forçava um viewBox estreito que cortava o texto (SVG tem
   `overflow: hidden` por padrão) e duplicava a informação. Ícone quadrado
   fixo = peso visual igual entre todas as marcas, sem gambiarra de largura. */
const SIZE = 28

function Wrap({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      style={{ display: 'block' }}
    >
      <title>{title}</title>
      {children}
    </svg>
  )
}

export function LogoMercadoLivre() {
  return (
    <Wrap title="Mercado Livre">
      <rect width={SIZE} height={SIZE} rx="8" fill="#FFE600" />
      <path d="M8 15c1.8-2.2 5.4-2.2 7.2 0 1.8 2.2 5.4 2.2 7.2 0" fill="none" stroke="#2D3277" strokeWidth="2.2" strokeLinecap="round" />
    </Wrap>
  )
}

export function LogoShopee() {
  return (
    <svg role="img" aria-label="Shopee" viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: 'block' }}>
      <title>Shopee</title>
      <defs>
        <linearGradient id="shopee-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7337" />
          <stop offset="100%" stopColor="#EE4D2D" />
        </linearGradient>
      </defs>
      <rect width={SIZE} height={SIZE} rx="8" fill="url(#shopee-grad)" />
      <path d="M9 12.5h10l-0.9 9.2a1.5 1.5 0 0 1-1.5 1.3h-5.2a1.5 1.5 0 0 1-1.5-1.3L9 12.5z" fill="#fff" />
      <path d="M11.6 12.5a2.4 2.4 0 0 1 4.8 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12.3 16.5c0.4 0.5 1 0.8 1.7 0.8s1.3-0.3 1.7-0.8" fill="none" stroke="#EE4D2D" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function LogoAmazon() {
  return (
    <Wrap title="Amazon">
      <rect width={SIZE} height={SIZE} rx="8" fill="#131921" />
      <text x={SIZE / 2} y="16.5" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fontWeight="700" fill="#fff">a</text>
      <path d="M7.5 19.5c4.5 3 11 3 14.5-0.3" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 19.7l1.6-0.6-0.5 1.7z" fill="#FF9900" />
    </Wrap>
  )
}

// Leroy Merlin: a marca é um WORDMARK (não há símbolo/ícone oficial). Recriação
// fiel do lockup — tile verde da marca (#78BE20) com o wordmark "LEROY MERLIN"
// empilhado em branco. NÃO usar o monograma "LM" (não é a marca). Substituir
// pelo SVG oficial quando disponível. Mantém proporção ~quadrada para caber
// tanto no balão do hero quanto nos cards/marquee da seção de marketplaces.
export function LogoLeroyMerlin() {
  return (
    <svg role="img" aria-label="Leroy Merlin" viewBox="0 0 28 28" width={SIZE} height={SIZE} style={{ display: 'block' }}>
      <title>Leroy Merlin</title>
      <rect width="28" height="28" rx="8" fill="#78BE20" />
      <text x="14" y="12.5" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="6.2" letterSpacing="-0.2" fill="#fff">LEROY</text>
      <text x="14" y="21" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="6.2" letterSpacing="-0.2" fill="#fff">MERLIN</text>
    </svg>
  )
}

export function LogoMagalu() {
  return (
    <Wrap title="Magalu">
      <rect width={SIZE} height={SIZE} rx="8" fill="#0086FF" />
      <circle cx={SIZE / 2} cy={SIZE / 2} r="7" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx={SIZE / 2} cy={SIZE / 2} r="2.4" fill="#fff" />
    </Wrap>
  )
}

export function LogoShopify() {
  return (
    <Wrap title="Shopify">
      <rect width={SIZE} height={SIZE} rx="8" fill="#95BF47" />
      <path d="M17 6.5c-.3 0-.6.1-.9.2-.5-.8-1.1-.7-1.1-.7s-4.6.9-5.6 5.3c-.8 3.2-1.9 8.7-1.9 8.7l6.7 1.5 4.5-1.2-2-13.5-.4-.3zM15.9 8.7c-.7.2-1.4.4-2.2.6.2-.9.7-1.8 1.3-2z" fill="#fff" />
    </Wrap>
  )
}

export function LogoNuvemshop() {
  return (
    <Wrap title="Nuvemshop">
      <rect width={SIZE} height={SIZE} rx="8" fill="#2C6DF6" />
      <path d="M9 19a4.2 4.2 0 0 1-.4-8.4A5.4 5.4 0 0 1 19 12.4a3.5 3.5 0 0 1-1 6.6H9z" fill="#fff" />
    </Wrap>
  )
}

export function LogoWooCommerce() {
  return (
    <Wrap title="WooCommerce">
      <rect width={SIZE} height={SIZE} rx="8" fill="#7F54B3" />
      <path d="M8 11.5l1.4 6.5 2.1-6.5M14.5 11.5l1.4 6.5 2.1-6.5" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Wrap>
  )
}

export function LogoLojaPropria() {
  return (
    <svg role="img" aria-label="Loja Própria" viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: 'block' }}>
      <title>Loja Própria</title>
      <defs>
        <linearGradient id="lojapropria-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A9DFF" />
          <stop offset="100%" stopColor="#8A5CF6" />
        </linearGradient>
      </defs>
      <rect width={SIZE} height={SIZE} rx="8" fill="url(#lojapropria-grad)" />
      <path d="M8 11.5l1-3.5h10l1 3.5v0.6a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0v-0.6z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 13.5v7.5h10v-7.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="14" cy="17.5" r="1.6" fill="none" stroke="#fff" strokeWidth="1.2" />
      <circle cx="14" cy="17.1" r="0.5" fill="#fff" />
    </svg>
  )
}
