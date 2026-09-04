import type { MKTOnlineLogoProps } from './mkt-online-logo.types'
import './mkt-online-logo.css'

// Marca oficial aplicada como arquivo (ver docs/04-Audits) — nunca reconstruir
// em SVG/CSS. Fonte: public/brand/logooficial.png (usuário), recortada sem
// alterar nenhum pixel do desenho.
export default function MKTOnlineLogo({ mode = 'horizontal', size = 'md', className = '' }: MKTOnlineLogoProps) {
  const src = mode === 'symbol' ? '/brand/mktonline-symbol.png' : '/brand/mktonline-logo-horizontal.png'
  const classes = ['mkt-online-logo', `mkt-online-logo--${mode}`, `mkt-online-logo--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return <img src={src} alt="MKTOnline" className={classes} draggable={false} />
}
