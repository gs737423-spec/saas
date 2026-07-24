// Palco visual da pessoa do hero — forma principal (arco) + forma secundária +
// detalhe âmbar + base/pedestal + sombra de contato + pessoa. As 3 pessoas
// ficam SEMPRE montadas (camadas persistentes, position:absolute, mesmo
// palco/base/altura) — troca de slide só muda opacity/visibility/transform,
// nunca remonta a <img> nem re-decodifica do zero. Isso evita o atraso/"queda"
// da pessoa depois da copy trocar.
export default function HeroPersonStage({
  people, activeIndex,
}: {
  people: { src: string; alt: string }[]
  activeIndex: number
}) {
  return (
    <div className="hero-stage">
      <span className="hero-stage-main" aria-hidden="true" />
      <span className="hero-stage-secondary" aria-hidden="true" />
      <span className="hero-stage-amber" aria-hidden="true" />
      <span className="hero-stage-base" aria-hidden="true" />
      {people.map((p, i) => (
        <img
          key={p.src}
          src={p.src}
          alt={i === activeIndex ? p.alt : ''}
          aria-hidden={i === activeIndex ? undefined : true}
          className="hero-person"
          data-active={i === activeIndex}
          loading="eager"
          draggable={false}
        />
      ))}
    </div>
  )
}
