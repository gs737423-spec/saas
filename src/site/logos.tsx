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
    <Wrap title="Shopee">
      <rect width={SIZE} height={SIZE} rx="8" fill="#EE4D2D" />
      <path d="M8.5 12h11l-1 10.5a1.6 1.6 0 0 1-1.6 1.4h-5.8a1.6 1.6 0 0 1-1.6-1.4L8.5 12z" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M11.5 12a2.5 2.5 0 0 1 5 0" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </Wrap>
  )
}

export function LogoAmazon() {
  return (
    <Wrap title="Amazon">
      <rect width={SIZE} height={SIZE} rx="8" fill="#131921" />
      <text x={SIZE / 2} y="17" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" fill="#fff">a</text>
      <path d="M7 20c5 3 11 3 15 0.3" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 20.3l-2.3-0.8 1 2.3" fill="#FF9900" />
    </Wrap>
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
    <Wrap title="Loja Própria">
      <rect width={SIZE} height={SIZE} rx="8" fill="#EAF0FF" />
      <path d="M7 12l1.4-4h11.2l1.4 4v1a2.4 2.4 0 0 1-4.8 0 2.4 2.4 0 0 1-4.8 0 2.4 2.4 0 0 1-4.8 0v-1z" fill="none" stroke="#3D74F0" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.5 14.5v6.5h11v-6.5" fill="none" stroke="#3D74F0" strokeWidth="1.7" strokeLinejoin="round" />
    </Wrap>
  )
}
