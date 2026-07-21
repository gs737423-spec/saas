// Palco visual da pessoa do hero — substitui os balões/formas soltas por uma
// composição única: forma principal (arco) + forma secundária + detalhe
// âmbar + base/pedestal + sombra de contato + pessoa. Nada aqui é
// position:absolute solto sem função — cada camada ancora a próxima.
export default function HeroPersonStage({
  person, personAlt, eager,
}: {
  person: string
  personAlt: string
  eager?: boolean
}) {
  return (
    <div className="hero-stage">
      <span className="hero-stage-main" aria-hidden="true" />
      <span className="hero-stage-secondary" aria-hidden="true" />
      <span className="hero-stage-amber" aria-hidden="true" />
      <span className="hero-stage-base" aria-hidden="true" />
      <img
        key={person}
        src={person}
        alt={personAlt}
        className="hero-person"
        data-active="true"
        loading={eager ? 'eager' : 'lazy'}
        draggable={false}
      />
    </div>
  )
}
