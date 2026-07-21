import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { faqItems } from '@/site/content'

// FAQ dark: label + título à esquerda, acordeões à direita.
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="sec-deep scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Reveal>
            <span className="site-label mb-2" style={{ color: '#6EC8FF' }}>Perguntas frequentes</span>
            <h2 className="text-[22px] font-extrabold tracking-tight vt-ink md:text-[26px]">
              Ainda com dúvidas?
            </h2>
            <p className="mt-2 max-w-xs text-[14px] vt-muted" style={{ lineHeight: 1.5 }}>
              Respostas rápidas sobre integrações, canais e funcionamento da Vintec.
            </p>
          </Reveal>

          <Reveal delay={60}>
            <ul className="space-y-2.5">
              {faqItems.map((item, i) => {
                const isOpen = open === i
                const bodyId = `faq-body-${i}`
                const btnId = `faq-btn-${i}`
                return (
                  <li key={item.q} className="vt-card overflow-hidden" style={{ borderRadius: 16 }}>
                    <h3>
                      <button
                        id={btnId}
                        aria-expanded={isOpen}
                        aria-controls={bodyId}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                      >
                        <span className="text-[14px] font-bold vt-ink">{item.q}</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(39, 93, 255,0.14)', color: '#6EC8FF' }}>
                          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    </h3>
                    <div id={bodyId} role="region" aria-labelledby={btnId} className="faq-body" data-open={isOpen}>
                      <div>
                        <p className="px-4 pb-4 text-[13.5px] vt-muted" style={{ lineHeight: 1.55 }}>{item.a}</p>
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
