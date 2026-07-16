import { ShieldCheck, Building2, RefreshCw, UserCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import { marketplaces, trustStrip } from '@/site/content'

const trustIcons = [ShieldCheck, Building2, RefreshCw, UserCheck]

// Seção de marketplaces — presença forte, cards grandes (não uma faixa
// pequena de logos). O marquee automático fica só como reforço visual
// abaixo, os 4 canais prioritários aparecem primeiro em destaque.
export default function EcosystemMarquee() {
  const Row = ({ items, reverse, big }: { items: typeof marketplaces; reverse?: boolean; big?: boolean }) => (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`}>
      <div className="marquee__track" style={{ ['--marquee-duration' as string]: reverse ? '38s' : '30s' }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}
            style={{ gap: 'clamp(48px, 6vw, 84px)', paddingInline: 'clamp(48px, 6vw, 84px)' }}>
            {items.map((m) => (
              <li key={m.name} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap ${big ? 'marquee-logo--lg' : ''}`}>
                <span className="marquee-logo shrink-0"><m.Logo /></span>
                <span className="shrink-0 whitespace-nowrap text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{m.name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )

  return (
    <section id="marketplaces" aria-label="Marketplaces atendidos" className="marquee-band--ecosystem scroll-mt-24">
      <div className="site-container">
        <SectionHeader
          align="center"
          label="Marketplaces"
          title="Canais integrados à operação"
          desc="Começando pelos principais canais da operação, com estrutura projetada para conectar por API e evoluir para novos marketplaces."
        />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {marketplaces.map((m) => (
            <div key={m.name} className="site-card glow-on-hover flex flex-col items-center gap-3 p-5 text-center" style={{ minHeight: 128 }}>
              <span className="marquee-logo" style={{ opacity: 1, filter: 'none' }}><m.Logo /></span>
              <span className="text-[13.5px] font-bold" style={{ color: 'var(--s-ink)' }}>{m.name}</span>
            </div>
          ))}
        </div>

        <p className="mb-6 mt-10 text-center text-[13.5px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>
          Um ecossistema de canais, uma única visão da operação.
        </p>
        <Row items={marketplaces} big />

        {/* Faixa de confiança — compacta, funde no mesmo bloco */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-4" style={{ borderColor: 'var(--s-line)' }}>
          {trustStrip.map((t, i) => {
            const Icon = trustIcons[i]
            return (
              <div key={t.label} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(76,130,247,0.1)', color: 'var(--s-blue)' }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-bold" style={{ color: 'var(--s-ink)' }}>{t.label}</div>
                  <div className="truncate text-[11px]" style={{ color: 'var(--s-muted)' }}>{t.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--s-muted)' }}>
          As marcas mencionadas pertencem aos seus respectivos titulares.
        </p>
      </div>
    </section>
  )
}
