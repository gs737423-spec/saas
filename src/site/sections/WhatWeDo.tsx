import { Layers, FolderTree, Eye, Compass } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { whatWeDo } from '@/site/content'

const icons = [Layers, FolderTree, Eye, Compass]

export default function WhatWeDo() {
  return (
    <section style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-8 md:py-11">
        <SectionHeader align="center" label="O que a Vintec faz" title="O que ela resolve, na prática." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whatWeDo.map((item, i) => {
            const Icon = icons[i]
            return (
              <Reveal key={item.title} delay={i * 70} className="site-card glow-on-hover p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(20,135,125,0.1)', border: '1px solid var(--s-line)', color: 'var(--s-teal)' }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{item.title}</h3>
                <p className="mt-2 text-[13.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.55 }}>{item.text}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
