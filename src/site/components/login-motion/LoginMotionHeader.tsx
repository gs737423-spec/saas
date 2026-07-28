import { BAND_VIEWBOX } from './motionConfig'
import OperationTrack from './OperationTrack'
import FragmentedItems from './FragmentedItems'
import RunnerSprite from './RunnerSprite'
import OrganizedItems from './OrganizedItems'

/**
 * Faixa animada do topo do card (Vintec Motion Card). Pequena vinheta editorial:
 * desordem (esquerda) → movimento (centro, corredor) → organização (direita).
 *
 * FASE 1: composição ESTÁTICA (sem corrida). O corredor é um slot reservado com
 * marcador provisório — a sprite profissional entra na Fase 2. Puramente visual,
 * desacoplada da autenticação.
 */
export default function LoginMotionHeader() {
  const { w, h } = BAND_VIEWBOX
  return (
    <div className="lm" aria-hidden="true">
      <svg className="lm__svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <radialGradient id="lmGlow" cx="50%" cy="18%" r="70%">
            <stop offset="0%" stopColor="#4d8bff" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#2a5bd0" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0b1f39" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* profundidade do fundo */}
        <rect x="0" y="0" width={w} height={h} fill="url(#lmGlow)" />
        <circle className="lm-bg__orb" cx={470} cy={40} r={110} />
        <ellipse className="lm-bg__floor" cx={300} cy={168} rx={280} ry={26} />

        <OperationTrack />
        <FragmentedItems />
        <OrganizedItems />
        <RunnerSprite />
      </svg>
    </div>
  )
}
