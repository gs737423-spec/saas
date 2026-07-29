import { Link } from 'react-router-dom'

// Marca do topo — wordmark textual, sem símbolo. Mesma identidade do site
// institucional (só o nome "MKTOnline", sem monograma/ícone geométrico).
// Reduzida de 26px/extrabold pra 19px/bold com gradiente sutil — a versão
// anterior pesava demais sobre o resto do header (pedido: "logo grande
// demais, tira atenção do restante da tela").
export default function Brand() {
  return (
    <Link to="/app" className="flex shrink-0 items-center">
      <span
        className="truncate text-[19px] font-bold leading-none text-gradient"
        style={{ letterSpacing: '-0.01em' }}
      >
        MKTOnline
      </span>
    </Link>
  )
}
