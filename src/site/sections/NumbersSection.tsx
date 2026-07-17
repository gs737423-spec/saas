import Reveal from '@/site/components/Reveal'
import { about, numbers } from '@/site/content'

// Segunda seção — quebra de contraste logo após a hero: fundo off-white,
// leitura editorial em duas colunas (texto institucional à esquerda, bloco de
// indicadores à direita), na lógica do "Quem Somos" da Petina. Números grandes,
// labels pequenas, divisórias discretas — sem cards, sem glass, sem dashboard.
export default function NumbersSection() {
  return (
    <section id="sobre" className="vt-light scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
          {/* Coluna esquerda — institucional */}
          <Reveal>
            <span className="site-label mb-3" style={{ color: '#0F8A7C' }}>{about.label}</span>
            <h2 className="site-h2" style={{ color: '#17324d' }}>{about.title}</h2>
            <p className="site-lead mt-5" style={{ color: '#52677a' }}>{about.text}</p>
          </Reveal>

          {/* Coluna direita — indicadores em grid editorial 2×2 */}
          <Reveal delay={80} className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
            {numbers.map((n, i) => (
              <div
                key={n.label}
                className={`${i % 2 === 1 ? 'sm:border-l sm:pl-10' : ''} ${i >= 2 ? 'border-t pt-8' : ''}`}
                style={{ borderColor: 'rgba(23,50,77,0.12)' }}
              >
                <div className="text-[3.4rem] font-extrabold leading-[0.9] tracking-tight" style={{ color: '#17324d' }}>{n.value}</div>
                <div className="mt-3 text-[14.5px] font-bold" style={{ color: '#17324d' }}>{n.label}</div>
                <div className="mt-1.5 text-[13px]" style={{ color: '#6B8688', lineHeight: 1.5 }}>{n.desc}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
