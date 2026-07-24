interface Moment {
  label: string
  text: string
}

const moments: Moment[] = [
  { label: 'ENTENDIMENTO', text: 'Conhecemos os canais, controles, objetivos e principais dificuldades da empresa.' },
  { label: 'DIAGNÓSTICO', text: 'Analisamos os indicadores e identificamos os pontos que merecem atenção.' },
  { label: 'ACOMPANHAMENTO', text: 'Definimos prioridades junto com a gestão e acompanhamos a evolução da operação.' },
]

// Como trabalhamos — bem compacta, só entendimento→diagnóstico→acompanhamento
// (não é a mesma coisa que a antiga "experiência"/"como atuamos": aqui é só
// o início do relacionamento, sem números/timeline/CTA próprio, pra não
// duplicar o CTA da seção final). `id="como-funciona"` é âncora de
// compatibilidade sem caixa própria — o Footer ainda tem 2 links pra ela.
export default function ComoTrabalhamosSection() {
  return (
    <section id="como-trabalhamos" className="sec-cool trabalhamos-section scroll-mt-24">
      <span id="como-funciona" aria-hidden="true" className="trabalhamos-compat-anchor" />
      <div className="site-container site-container--tight trabalhamos-container" style={{ maxWidth: 1200 }}>
        <span className="trabalhamos-eyebrow">COMO COMEÇA O TRABALHO</span>
        <h2 className="trabalhamos-title">Entendemos o cenário antes de recomendar qualquer direção.</h2>

        <div className="trabalhamos-panel">
          <div className="trabalhamos-moments">
            {moments.map((m) => (
              <div key={m.label} className="trabalhamos-moment">
                <span className="trabalhamos-moment__label">{m.label}</span>
                <p className="trabalhamos-moment__text">{m.text}</p>
              </div>
            ))}
          </div>
          <p className="trabalhamos-panel__base">
            O diagnóstico inicia o trabalho. O acompanhamento constrói o resultado ao longo do tempo.
          </p>
        </div>
      </div>
    </section>
  )
}
