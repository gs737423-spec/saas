import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { faqItems } from '@/site/content'

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader label="Perguntas frequentes" title="Tudo o que você precisa saber antes da demonstração." align="center" />

        <Reveal className="mx-auto mt-12 max-w-3xl">
          <ul className="space-y-3">
            {faqItems.map((item, i) => {
              const isOpen = open === i
              const bodyId = `faq-body-${i}`
              const btnId = `faq-btn-${i}`
              return (
                <li key={item.q} className="site-card overflow-hidden" style={{ borderRadius: 18 }}>
                  <h3>
                    <button
                      id={btnId}
                      aria-expanded={isOpen}
                      aria-controls={bodyId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{item.q}</span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--s-bg-soft)', color: 'var(--s-blue)' }}>
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                  </h3>
                  <div id={bodyId} role="region" aria-labelledby={btnId} className="faq-body" data-open={isOpen}>
                    <div>
                      <p className="px-5 pb-5 text-[14.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.6 }}>{item.a}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
