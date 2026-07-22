// Palco visual da pessoa do hero — forma principal (arco) + forma secundária +
// detalhe âmbar + base/pedestal + sombra de contato + pessoa. As 3 pessoas
// ficam SEMPRE montadas (camadas persistentes, position:absolute, mesmo
// palco/base/altura) — troca de slide só muda opacity/visibility/transform,
// nunca remonta a <img> nem re-decodifica do zero. Isso evita o atraso/"queda"
// da pessoa depois da copy trocar.
//
// `duo` é usado SOMENTE pelo 2º slide (índice 1): reaproveita o MESMO arco
// azul (não cria uma 2ª forma) só que redimensionado via [data-duo='true'],
// e soma uma 2ª pessoa (a mulher do slide 1) ao lado da pessoa do próprio
// slide 2, ambas ancoradas na mesma base. Slides 0 e 2 não são afetados.
export default function HeroPersonStage({
  people, activeIndex, duo,
}: {
  people: { src: string; alt: string }[]
  activeIndex: number
  duo?: { index: number; partner: { src: string; alt: string } }
}) {
  const duoActive = duo != null && activeIndex === duo.index
  return (
    <div className="hero-stage" data-duo={duoActive}>
      <span className="hero-stage-main" aria-hidden="true" />
      <span className="hero-stage-secondary" aria-hidden="true" />
      <span className="hero-stage-amber" aria-hidden="true" />
      <span className="hero-stage-base" aria-hidden="true" />
      {people.map((p, i) => (
        <img
          key={p.src}
          src={p.src}
          alt={i === activeIndex ? (duoActive ? `${p.alt} e ${duo!.partner.alt}` : p.alt) : ''}
          aria-hidden={i === activeIndex ? undefined : true}
          className={`hero-person${duoActive && i === activeIndex ? ' hero-person--duo-b' : ''}`}
          data-active={i === activeIndex}
          loading="eager"
          draggable={false}
        />
      ))}
      {duo && (
        <img
          src={duo.partner.src}
          alt=""
          aria-hidden="true"
          className="hero-person hero-person--duo-a"
          data-active={duoActive}
          loading="eager"
          draggable={false}
        />
      )}
    </div>
  )
}
