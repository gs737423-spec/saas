/**
 * Lado esquerdo da faixa — três pequenos elementos operacionais dispersos e
 * levemente desalinhados: etiqueta de pedido, cubo de estoque, indicador de
 * valor (acento âmbar pontual). Estático nesta fase. `data-frag` permite ocultar
 * o 3º no mobile (reduzir de três para dois).
 */
export default function FragmentedItems() {
  return (
    <g className="lm-frag" aria-hidden="true">
      {/* etiqueta de pedido */}
      <g className="lm-frag__item" data-frag="0" transform="rotate(-8 74 96)">
        <rect className="lm-frag__panel" x={52} y={88} width={38} height={17} rx={4} />
        <line className="lm-frag__line" x1={59} y1={97} x2={83} y2={97} />
      </g>
      {/* cubo de estoque */}
      <g className="lm-frag__item" data-frag="1" transform="rotate(7 82 132)">
        <rect className="lm-frag__box" x={68} y={120} width={22} height={22} rx={4} />
        <line className="lm-frag__edge" x1={68} y1={127} x2={90} y2={127} />
      </g>
      {/* indicador de valor (âmbar) */}
      <g className="lm-frag__item" data-frag="2" transform="rotate(5 132 108)">
        <rect className="lm-frag__panel" x={112} y={98} width={40} height={22} rx={5} />
        <circle className="lm-frag__coin" cx={124} cy={109} r={6} />
        <line className="lm-frag__bar" x1={136} y1={106} x2={147} y2={106} />
        <line className="lm-frag__bar" x1={136} y1={114} x2={143} y2={114} />
      </g>
    </g>
  )
}
