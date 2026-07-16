import { Layers, FolderTree, Eye, Compass } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { about, numbers, whatWeDo } from '@/site/content'

const doIcons = [Layers, FolderTree, Eye, Compass]

// Bloco institucional: "o que é a Vintec e por que importa" + números
// estruturais reais + os 4 highlights do que ela resolve (fusão do antigo
// WhatWeDo). Fundo escuro premium.
export default function NumbersSection() {
  return (
    <section id="sobre" className="sec-glow scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <span className="site-label mb-3" style={{ color: '#4FD9C9' }}>{about.label}</span>
            <h2 className="site-h2 vt-ink">{about.title}</h2>
            <p className="site-lead mt-4 vt-muted">{about.text}</p>
          </Reveal>

          <Reveal delay={80} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {numbers.map((n) => (
              <div key={n.label} className="vt-card p-5">
                <div className="text-[2.5rem] font-extrabold leading-none tracking-tight" style={{ color: '#4FD9C9' }}>{n.value}</div>
                <div className="mt-2 text-[14px] font-bold vt-ink">{n.label}</div>
                <div className="mt-1 text-[12.5px] vt-muted">{n.desc}</div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Highlights: o que a Vintec resolve */}
        <div className="mt-12 grid gap-4 border-t pt-12 vt-hair sm:grid-cols-2 lg:grid-cols-4">
          {whatWeDo.map((item, i) => {
            const Icon = doIcons[i]
            return (
              <Reveal key={item.title} delay={i * 70} className="vt-card p-5">
                <span className="vt-ico"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-[15px] font-bold vt-ink">{item.title}</h3>
                <p className="mt-2 text-[13px] vt-muted" style={{ lineHeight: 1.55 }}>{item.text}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
