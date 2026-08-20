// Fundo institucional estático. As duas malhas saem naturalmente da viewport;
// não há partículas, placas diagonais, animação ou lógica interativa.
export default function LoginAtmosphereBackground() {
  return (
    <div className="access-background" aria-hidden="true">
      <svg className="access-flow access-flow--left" viewBox="0 0 840 460" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((line) => (
          <path key={line} d={`M-90 ${330 + line * 20} C 130 ${205 + line * 17}, 390 ${430 - line * 15}, 930 ${180 + line * 18}`} />
        ))}
      </svg>
      <svg className="access-flow access-flow--right" viewBox="0 0 780 420" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((line) => (
          <path key={line} d={`M-100 ${55 + line * 20} C 170 ${195 + line * 12}, 430 ${-20 + line * 18}, 880 ${190 + line * 16}`} />
        ))}
      </svg>
    </div>
  )
}
