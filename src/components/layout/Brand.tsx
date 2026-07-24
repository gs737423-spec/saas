import { Link } from 'react-router-dom'

// Marca do topo — wordmark textual, sem símbolo. Mesma identidade do site
// institucional (só o nome "Vintec", sem monograma/ícone geométrico).
export default function Brand() {
  return (
    <Link to="/app" className="flex shrink-0 items-center">
      <span className="truncate text-[26px] font-extrabold leading-none tracking-tight text-text-primary" style={{ letterSpacing: '-0.02em' }}>
        Vintec
      </span>
    </Link>
  )
}
