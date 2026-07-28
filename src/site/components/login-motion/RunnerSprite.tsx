import { RUNNER_SLOT } from './motionConfig'

/**
 * Centro da faixa — espaço EXATO reservado para a sprite profissional do
 * corredor (Fase 2). Nesta fase NÃO desenhamos um personagem: só um marcador
 * provisório discreto (silhueta mínima abstrata) dentro do slot reservado, com
 * um pequeno pacote de dados. O asset final (sprite sheet .webp) ainda precisa
 * ser fornecido — ver motionConfig.RUNNER_SPRITE_SRC.
 */
export default function RunnerSprite() {
  const { x, y, w, h } = RUNNER_SLOT
  const cx = x + w / 2
  return (
    <g className="lm-runner" aria-hidden="true">
      {/* sombra curta */}
      <ellipse className="lm-runner__shadow" cx={cx} cy={y + h - 2} rx={26} ry={5} />

      {/* slot reservado (área exata da sprite) */}
      <rect className="lm-runner__slot" x={x} y={y} width={w} height={h} rx={10} />

      {/* marcador provisório discreto — silhueta mínima, NÃO é a arte final */}
      <g className="lm-runner__marker">
        <circle cx={cx} cy={y + 30} r={11} />
        <path d={`M${cx - 12},${y + 96} C${cx - 12},${y + 60} ${cx + 12},${y + 60} ${cx + 12},${y + 96} Z`} />
      </g>
      <text className="lm-runner__tag" x={cx} y={y + h + 12} textAnchor="middle">
        sprite (pendente)
      </text>

      {/* pequeno pacote de dados conduzido pelo personagem */}
      <rect className="lm-runner__package" x={cx + 14} y={y + 52} width={20} height={16} rx={5} />
      <line className="lm-runner__package-spark" x1={cx + 19} y1={y + 60} x2={cx + 29} y2={y + 60} />
    </g>
  )
}
