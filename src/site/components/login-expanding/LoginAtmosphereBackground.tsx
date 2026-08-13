// Fundo institucional estático. As duas malhas saem naturalmente da viewport;
// não há partículas, placas diagonais, animação ou lógica interativa.
export default function LoginAtmosphereBackground() {
  return (
    <div className="access-background" aria-hidden="true">
      <svg className="access-flow access-flow--left" viewBox="0 0 720 420" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((line) => (
          <path key={line} d={`M-40 ${250 + line * 24} C 150 ${160 + line * 18}, 330 ${390 - line * 18}, 760 ${210 + line * 20}`} />
        ))}
      </svg>
      <svg className="access-flow access-flow--right" viewBox="0 0 660 380" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((line) => (
          <path key={line} d={`M-30 ${80 + line * 22} C 170 ${170 + line * 12}, 350 ${10 + line * 20}, 700 ${150 + line * 18}`} />
        ))}
      </svg>
    </div>
  )
}
