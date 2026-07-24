import { closingPoints } from '@/site/data/differentials'

// Seção "Por que Vintec" — não faz mais parte da renderização pública
// (os 3 argumentos foram incorporados como faixa final de HowItWorks.tsx,
// ver `closing-strip`). Arquivo preservado, fora do import tree de
// SitePage.tsx.
export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="sec-warm scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-20">
        <div className="closing-strip__row">
          {closingPoints.map((p) => (
            <div key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
