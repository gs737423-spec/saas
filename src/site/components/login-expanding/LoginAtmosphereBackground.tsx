// Fundo abstrato da tela de login — só efeito visual, sem lógica. Fica atrás
// de .lx-topbar/.lx-stage (ambos já com z-index:1), pointer-events:none,
// não intercepta clique nem estica o layout. Regra central: centro da tela
// limpo (onde o card fica) — todo detalhe concentrado nos 4 cantos, sem
// simetria perfeita entre eles. Nada de onda literal: só linhas finas tipo
// "corrente digital", névoa translúcida e partículas raras. Movimento (se
// houver) só entra sob prefers-reduced-motion: no-preference — mesma
// convenção já usada em .lx-sign (ver site.css).
const dustTL = [
  { top: 18, left: 9, size: 1.6, delay: 0 },
  { top: 22, left: 14, size: 1.1, delay: 0.6 },
  { top: 27, left: 10, size: 1.3, delay: 1.4 },
  { top: 15, left: 19, size: 0.9, delay: 2.1 },
  { top: 31, left: 16, size: 1.4, delay: 0.9 },
]

const dustBR = [
  { top: 82, left: 91, size: 1.5, delay: 0.3 },
  { top: 77, left: 86, size: 1.1, delay: 1.7 },
  { top: 88, left: 89, size: 1.3, delay: 0.8 },
  { top: 85, left: 95, size: 0.9, delay: 2.4 },
]

export default function LoginAtmosphereBackground() {
  return (
    <div className="lx-atmo" aria-hidden="true">
      <div className="lx-atmo-depth" />
      <div className="lx-atmo-depth-move" />
      <div className="lx-atmo-vignette" />

      {/* Canto superior esquerdo — interseção fina de linhas + poeira leve. */}
      <svg className="lx-atmo-lines lx-atmo-lines--tl" viewBox="0 0 400 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lxAtmoTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#63B3FF" stopOpacity="0" />
            <stop offset="55%" stopColor="#7AC6FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#63B3FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-30,40 C60,90 90,150 180,120 C260,95 300,180 400,150" fill="none" stroke="url(#lxAtmoTL)" strokeWidth="1" />
        <path d="M-20,160 C70,110 110,60 220,80" fill="none" stroke="url(#lxAtmoTL)" strokeWidth="0.6" opacity="0.6" strokeDasharray="2 6" />
      </svg>
      <span className="lx-atmo-glow lx-atmo-glow--tl" />
      <span className="lx-atmo-dust lx-atmo-dust--tl">
        {dustTL.map((d, i) => (
          <i key={i} style={{ top: `${d.top}%`, left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s` }} />
        ))}
      </span>

      {/* Lateral superior direita — camada de vidro escuro em diagonal. */}
      <span className="lx-atmo-panel" />

      {/* Inferior esquerda — linhas topográficas finas, sem ocupar o centro. */}
      <svg className="lx-atmo-lines lx-atmo-lines--bl" viewBox="0 0 500 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lxAtmoBL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3168FF" stopOpacity="0" />
            <stop offset="40%" stopColor="#62B7FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3168FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-40,60 C90,20 150,90 260,50 C340,22 380,70 520,40" fill="none" stroke="url(#lxAtmoBL)" strokeWidth="0.7" />
        <path d="M-40,110 C110,150 170,90 280,120 C360,142 400,100 520,120" fill="none" stroke="url(#lxAtmoBL)" strokeWidth="0.5" opacity="0.55" strokeDasharray="1 5" />
        <path d="M-40,170 C120,190 190,150 300,175" fill="none" stroke="url(#lxAtmoBL)" strokeWidth="0.5" opacity="0.35" />
      </svg>

      {/* Inferior direita — outro conjunto, assimétrico ao da esquerda. */}
      <svg className="lx-atmo-lines lx-atmo-lines--br" viewBox="0 0 420 320" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lxAtmoBR" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2BD6A0" stopOpacity="0" />
            <stop offset="50%" stopColor="#63B3FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2BD6A0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M460,260 C360,300 320,240 240,270 C160,298 120,250 -20,280" fill="none" stroke="url(#lxAtmoBR)" strokeWidth="0.8" />
        <path d="M460,190 C380,160 340,210 260,180" fill="none" stroke="url(#lxAtmoBR)" strokeWidth="0.5" opacity="0.5" strokeDasharray="2 6" />
      </svg>
      <span className="lx-atmo-glow lx-atmo-glow--br" />
      <span className="lx-atmo-dust lx-atmo-dust--br">
        {dustBR.map((d, i) => (
          <i key={i} style={{ top: `${d.top}%`, left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s` }} />
        ))}
      </span>
    </div>
  )
}
