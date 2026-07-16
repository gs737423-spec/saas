import { ShieldCheck, Building2, Network, UserCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import { marketplaces, trustStrip } from '@/site/content'

const trustIcons = [ShieldCheck, Building2, Network, UserCheck]

// Marketplaces — bloco forte no dark: cards grandes com logo + nome,
// marquee de reforço abaixo, faixa de confiança. API-first, sem selo de
// status. Composição com presença, não 4 quadradinhos.
export default function EcosystemMarquee() {
  const Row = ({ items, reverse, big }: { items: typeof marketplaces; reverse?: boolean; big?: boolean }) => (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`}>
      <div className="marquee__track" style={{ ['--marquee-duration' as string]: reverse ? '38s' : '30s' }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}
            style={{ gap: 'clamp(48px, 6vw, 84px)', paddingInline: 'clamp(48px, 6vw, 84px)' }}>
            {items.map((m) => (
              <li key={m.name} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap ${big ? 'marquee-logo--lg' : ''}`}>
                <span className="marquee-logo shrink-0" style={{ opacity: 1, filter: 'none' }}><m.Logo /></span>
                <span className="shrink-0 whitespace-nowrap text-[15px] font-bold vt-ink">{m.name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )

  return (
    <section id="marketplaces" aria-label="Marketplaces atendidos" className="sec-mid scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <SectionHeader
          align="center"
          tone="dark"
          label="Marketplaces"
          title="Canais integrados à operação"
          desc="Começando pelos principais canais da operação, com estrutura projetada para conectar por API e evoluir para novos marketplaces."
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {marketplaces.map((m) => (
            <div key={m.name} className="vt-card flex flex-col items-center gap-3 p-6 text-center" style={{ minHeight: 150 }}>
              <span className="flex h-14 w-14 items-center justify-center" style={{ transform: 'scale(1.6)' }}>
                <m.Logo />
              </span>
              <span className="mt-2 text-[14px] font-bold vt-ink">{m.name}</span>
              <span className="text-[11px]" style={{ color: '#4FD9C9' }}>Conexão por API</span>
            </div>
          ))}
        </div>

        <div className="mt-12" style={{ opacity: 0.9 }}>
          <Row items={marketplaces} big />
        </div>

        {/* Faixa de confiança */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-10 vt-hair sm:grid-cols-4">
          {trustStrip.map((t, i) => {
            const Icon = trustIcons[i]
            return (
              <div key={t.label} className="flex items-start gap-3">
                <span className="vt-ico shrink-0" style={{ width: 40, height: 40 }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold vt-ink">{t.label}</div>
                  <div className="text-[11.5px] vt-muted">{t.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-[11px] vt-muted">
          As marcas mencionadas pertencem aos seus respectivos titulares.
        </p>
      </div>
    </section>
  )
}
