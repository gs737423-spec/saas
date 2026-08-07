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

// Arquivos reais fornecidos pelo dono do produto (public/site/logos/), não
// mais recriação em SVG. Preenche 100% do container do consumidor (nunca um
// tamanho/raio fixo aqui) — quem usa decide o tamanho e se é redondo/
// quadrado via className no wrapper (ex: rounded-full overflow-hidden).
// Tamanho fixo aqui sobrescrevia esse wrapper e deixava a logo pequena e
// deslocada dentro de um container maior.
function LogoImg({ src, title }: { src: string; title: string }) {
  return (
    <img
      src={src}
      alt={title}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}

export function LogoMercadoLivre() {
  return <LogoImg src="/site/logos/mercadolivre.png" title="Mercado Livre" />
}

export function LogoShopee() {
  return <LogoImg src="/site/logos/shopee.jpg" title="Shopee" />
}

export function LogoAmazon() {
  return <LogoImg src="/site/logos/amazon.jpg" title="Amazon" />
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
    <svg role="img" aria-label="Loja Própria" viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" style={{ display: 'block' }}>
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
