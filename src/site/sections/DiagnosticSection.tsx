import { AlertTriangle, TrendingDown, Percent, Boxes, PieChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { diagnosticExamples } from '@/site/content'

const icons = [TrendingDown, AlertTriangle, Percent, Boxes, PieChart]

// Diagnóstico executivo — o momento mais forte e tecnológico da página.
// Substitui a antiga grade de métricas soltas (com margem) por exemplos
// concretos de diagnóstico. Não alega IA — são regras executivas sobre o
// comportamento dos dados.
export default function DiagnosticSection() {
  return (
    <section id="diagnostico" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-4">
        <div className="site-dark overflow-hidden" style={{ borderRadius: 'var(--s-radius-block)' }}>
          <div className="px-6 py-8 md:px-14 md:py-11">
            <SectionHeader
              tone="dark"
              label="Diagnóstico executivo"
              title="Os dados mostram o que aconteceu. O diagnóstico mostra onde agir."
              desc="Regras executivas identificam riscos e oportunidades no comportamento dos dados — antes que virem prejuízo."
            />

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {diagnosticExamples.map((d, i) => {
                const Icon = icons[i]
                return (
                  <Reveal key={d.title} delay={i * 60}>
                    <div className="site-dark-card glow-on-hover h-full p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(76,130,247,0.14)', color: 'var(--s-blue-bright)' }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="mt-3 text-[13.5px] font-bold leading-snug" style={{ color: 'var(--s-dark-ink)' }}>{d.title}</h3>
                      <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: 'var(--s-dark-muted)' }}>{d.detail}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>

            <p className="mt-6 text-[11.5px]" style={{ color: 'var(--s-dark-muted)' }}>Exemplos ilustrativos — dados demonstrativos.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
