/* Marcas dos marketplaces em SVG (representações limpas, cores oficiais,
   proporção preservada). Renderizadas em tom neutro na faixa e recuperando a
   cor no hover. Usadas na faixa em movimento e na seção de Integrações. */
import type { CSSProperties } from 'react'

type LogoProps = { className?: string; style?: CSSProperties }

const H = 30 // altura visual base

function Wrap({ children, w, title }: { children: React.ReactNode; w: number; title: string }) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${w} ${H}`}
      height={H}
      width={w}
      style={{ display: 'block', height: H, width: 'auto' }}
    >
      <title>{title}</title>
      {children}
    </svg>
  )
}

export function LogoMercadoLivre() {
  return (
    <Wrap w={150} title="Mercado Livre">
      <rect x="0" y="4" width="52" height="22" rx="11" fill="#FFE600" />
      <path d="M12 15c2.4-3 7.2-3 9.6 0 2.4 3 7.2 3 9.6 0" fill="none" stroke="#2D3277" strokeWidth="2.4" strokeLinecap="round" />
      <text x="60" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Mercado Livre</text>
    </Wrap>
  )
}

export function LogoShopee() {
  return (
    <Wrap w={112} title="Shopee">
      <path d="M8 11h16l-1.4 13.5a2 2 0 0 1-2 1.8H11.4a2 2 0 0 1-2-1.8L8 11z" fill="none" stroke="#EE4D2D" strokeWidth="2.2" />
      <path d="M12.5 11a3.5 3.5 0 0 1 7 0" fill="none" stroke="#EE4D2D" strokeWidth="2.2" strokeLinecap="round" />
      <text x="34" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Shopee</text>
    </Wrap>
  )
}

export function LogoAmazon() {
  return (
    <Wrap w={104} title="Amazon">
      <text x="4" y="20" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700" fill="currentColor">amazon</text>
      <path d="M10 24c9 5 24 5 33 0.3" fill="none" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M43 24.3l-3.2-1 1.2 3.2" fill="#FF9900" />
    </Wrap>
  )
}

export function LogoMagalu() {
  return (
    <Wrap w={116} title="Magalu">
      <circle cx="15" cy="15" r="12" fill="#0086FF" />
      <circle cx="15" cy="15" r="4.4" fill="#fff" />
      <text x="34" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Magalu</text>
    </Wrap>
  )
}

export function LogoShopify() {
  return (
    <Wrap w={116} title="Shopify">
      <path d="M18 5.5c-.4 0-.8.1-1.2.3-.6-1-1.5-.9-1.5-.9S9.9 6.6 8.6 12.2C7.6 16.4 6 24 6 24l9 2 6-1.6-3-19zM16.8 8.2c-.9.2-1.9.5-2.9.8.3-1.2.9-2.4 1.8-2.7.4.5.8 1.1 1.1 1.9z" fill="#95BF47" />
      <path d="M18 5.5l1.9 19.9L23 24 20.2 6c-.7-.4-1.5-.5-2.2-.5z" fill="#5E8E3E" />
      <text x="30" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Shopify</text>
    </Wrap>
  )
}

export function LogoNuvemshop() {
  return (
    <Wrap w={140} title="Nuvemshop">
      <path d="M11 22a5.5 5.5 0 0 1-.6-11 7 7 0 0 1 13.4 1.8A4.6 4.6 0 0 1 23 22H11z" fill="#2C6DF6" />
      <text x="32" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Nuvemshop</text>
    </Wrap>
  )
}

export function LogoWooCommerce() {
  return (
    <Wrap w={158} title="WooCommerce">
      <rect x="2" y="8" width="26" height="15" rx="7.5" fill="#7F54B3" />
      <path d="M8 12.5l1.6 6 2-6M14 12.5l1.6 6 2-6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="34" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">WooCommerce</text>
    </Wrap>
  )
}

export function LogoLojaPropria() {
  return (
    <Wrap w={132} title="Loja Própria">
      <path d="M6 13l2-5h14l2 5v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V13z" fill="none" stroke="#3D74F0" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 16v8h14v-8" fill="none" stroke="#3D74F0" strokeWidth="2" strokeLinejoin="round" />
      <text x="34" y="20.5" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">Loja Própria</text>
    </Wrap>
  )
}
