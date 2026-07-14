import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { faqItems } from '@/site/content'

// FAQ compacto: label + título secundário à esquerda, acordeões à direita —
// não usa a headline de peso do hero para uma seção de apoio.
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Reveal>
            <span className="site-label mb-2">Perguntas frequentes</span>
            <h2 className="text-[22px] font-extrabold tracking-tight md:text-[26px]" style={{ color: 'var(--s-ink)' }}>
              Antes da demonstração.
            </h2>
            <p className="mt-2 max-w-xs text-[14px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.5 }}>
              Respostas rápidas sobre integrações, indicadores e funcionamento da plataforma.
            </p>
          </Reveal>

          <Reveal delay={60}>
            <ul className="space-y-2.5">
              {faqItems.map((item, i) => {
                const isOpen = open === i
                const bodyId = `faq-body-${i}`
                const btnId = `faq-btn-${i}`
                return (
                  <li key={item.q} className="site-card overflow-hidden" style={{ borderRadius: 16 }}>
                    <h3>
                      <button
                        id={btnId}
                        aria-expanded={isOpen}
                        aria-controls={bodyId}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                      >
                        <span className="text-[14px] font-bold" style={{ color: 'var(--s-ink)' }}>{item.q}</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--s-bg-soft)', color: 'var(--s-blue)' }}>
                          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    </h3>
                    <div id={bodyId} role="region" aria-labelledby={btnId} className="faq-body" data-open={isOpen}>
                      <div>
                        <p className="px-4 pb-4 text-[13.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.55 }}>{item.a}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
