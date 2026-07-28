/**
 * Pista sutil em forma de V — começa acima, desce no centro, sobe no fim.
 * Não é rua/pista de corrida/videogame: só uma linha de orientação discreta
 * com pequenos pontos. O corredor (Fase 2) percorre esse caminho.
 */
export default function OperationTrack() {
  return (
    <g className="lm-track" aria-hidden="true">
      <path className="lm-track__line" d="M56,78 C160,96 244,122 300,126 C356,122 440,96 544,78" />
      <circle className="lm-track__dot" cx={150} cy={98} r={2.4} />
      <circle className="lm-track__dot" cx={300} cy={126} r={2.4} />
      <circle className="lm-track__dot" cx={450} cy={98} r={2.4} />
    </g>
  )
}
