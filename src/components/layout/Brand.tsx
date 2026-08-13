import { Link } from 'react-router-dom'
import MKTOnlineLogo from '@/components/brand/MKTOnlineLogo'

// Marca do topo — símbolo oficial (arquivo, ver src/components/brand) +
// wordmark textual. Sora (única exceção de família na interface — todo o
// resto é Manrope, ver --font-brand em index.css). "MKT" 700 branco,
// "Online" 600 num cinza-azulado discreto. Sem espaço entre as partes.
export default function Brand() {
  return (
    <Link to="/app" className="flex shrink-0 items-center gap-2">
      <MKTOnlineLogo mode="symbol" size="sm" className="topnav-brand-symbol" />
      <span
        className="truncate font-brand text-[18px] leading-none sm:text-[20px]"
        style={{ letterSpacing: '-0.045em' }}
      >
        <span style={{ fontWeight: 700, color: '#F2F6FC' }}>MKT</span>
        <span style={{ fontWeight: 600, color: '#9EB7D3' }}>Online</span>
      </span>
    </Link>
  )
}
