import type { LoginCardState } from './expanding-login.types'

/**
 * Assinatura visual da Vintec — duas lâminas arredondadas convergentes que
 * sugerem discretamente um "V", em azul vivo + azul claro. NÃO é esfera,
 * mascote, globo ou objeto decorativo genérico: é a marca gráfica da tela.
 *
 * Puramente apresentacional (sem lógica de auth). Respira suavemente e emite
 * um pulso quando o card abre; tudo desligado em `prefers-reduced-motion` e
 * pausado quando a aba fica oculta (via `data-hidden` no card). Reage ao
 * estado do card por `data-state`.
 */
export default function VintecSignature({ state }: { state: LoginCardState }) {
  return (
    <div className="lx-sign" data-state={state} aria-hidden="true">
      <svg className="lx-sign__svg" viewBox="0 0 64 64" role="presentation">
        <defs>
          <linearGradient id="lxSignA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5A93FF" />
            <stop offset="1" stopColor="#2C5BD8" />
          </linearGradient>
          <linearGradient id="lxSignB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8CC6FF" />
            <stop offset="1" stopColor="#3E8BFF" />
          </linearGradient>
          <radialGradient id="lxSignGlow" cx="50%" cy="42%" r="60%">
            <stop offset="0" stopColor="#4d8bff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#4d8bff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* halo suave */}
        <circle className="lx-sign__halo" cx="32" cy="30" r="30" fill="url(#lxSignGlow)" />

        {/* duas lâminas convergentes = V discreto */}
        <path className="lx-sign__blade lx-sign__blade--a" d="M15 15 L31 43" fill="none"
          stroke="url(#lxSignA)" strokeWidth="9.5" strokeLinecap="round" />
        <path className="lx-sign__blade lx-sign__blade--b" d="M49 15 L33 43" fill="none"
          stroke="url(#lxSignB)" strokeWidth="9.5" strokeLinecap="round" />

        {/* ponto de convergência */}
        <circle className="lx-sign__spark" cx="32" cy="42" r="3" />
      </svg>
    </div>
  )
}
