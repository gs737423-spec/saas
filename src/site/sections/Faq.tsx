import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { faqItems } from '@/site/content'

// FAQ — família clara (light-100), título à esquerda, accordion à direita.
export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="sec-cool scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Reveal>
            <h2 className="text-[22px] font-extrabold tracking-tight md:text-[26px]" style={{ color: 'var(--vintec-text)' }}>
              Ainda com dúvidas?
            </h2>
            <p className="mt-2 max-w-xs text-[14px]" style={{ color: 'var(--vintec-text-soft)', lineHeight: 1.5 }}>
              Respostas rápidas sobre conexões, implantação e funcionamento da Vintec.
            </p>
          </Reveal>

          <Reveal delay={60} className="max-w-xl">
            <ul className="space-y-2">
              {faqItems.map((item, i) => {
                const isOpen = open === i
                const bodyId = `faq-body-${i}`
                const btnId = `faq-btn-${i}`
                return (
                  <li key={item.q} className="overflow-hidden" style={{
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: `1px solid ${isOpen ? 'var(--vintec-blue-500)' : 'var(--vintec-border)'}`,
                  }}>
                    <h3>
                      <button
                        id={btnId}
                        aria-expanded={isOpen}
                        aria-controls={bodyId}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                      >
                        <span className="text-[14px] font-bold" style={{ color: 'var(--vintec-text)' }}>{item.q}</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(53,104,255,0.1)', color: 'var(--vintec-blue-600)' }}>
                          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    </h3>
                    <div id={bodyId} role="region" aria-labelledby={btnId} className="faq-body" data-open={isOpen}>
                      <div>
                        <p className="px-4 pb-4 text-[14px]" style={{ color: 'var(--vintec-text-soft)', lineHeight: 1.6 }}>{item.a}</p>
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
