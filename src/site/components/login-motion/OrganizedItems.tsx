/**
 * Lado direito da faixa — os mesmos elementos agora ORGANIZADOS: três módulos
 * alinhados e encaixados + um pequeno check de confirmação (acento âmbar).
 * Comunica a chegada à organização. Estático nesta fase.
 */
export default function OrganizedItems() {
  const rows = [88, 110, 132]
  return (
    <g className="lm-org" aria-hidden="true">
      {rows.map((yy, i) => (
        <g className="lm-org__mod" key={i}>
          <rect className="lm-org__panel" x={452} y={yy} width={78} height={16} rx={4} />
          <circle className="lm-org__dot" cx={462} cy={yy + 8} r={2.6} />
          <line className="lm-org__line" x1={472} y1={yy + 8} x2={520} y2={yy + 8} />
        </g>
      ))}
      {/* check de confirmação */}
      <circle className="lm-org__check-ring" cx={520} cy={74} r={11} />
      <path className="lm-org__check" d="M515,74 l3,4 l7,-8" />
    </g>
  )
}
