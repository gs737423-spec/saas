import { ShieldCheck, Building2, RefreshCw, UserCheck } from 'lucide-react'
import { marketplaces, trustStrip, statusTone } from '@/site/content'

const trustIcons = [ShieldCheck, Building2, RefreshCw, UserCheck]

// Marquee premium do ecossistema — duas linhas rolando em direções opostas,
// logos grandes, glow de linha nas bordas. Cada logo carrega um ponto de
// status (cor + title) coerente com a seção de Integrações — nunca sugere
// que um canal está pronto quando não está (regra validada nas fases
// anteriores). Abaixo, a faixa de confiança compacta se funde no mesmo bloco.
export default function EcosystemMarquee() {
  const half = Math.ceil(marketplaces.length / 2)
  const rowA = marketplaces
  const rowB = [...marketplaces.slice(half), ...marketplaces.slice(0, half)]

  const Row = ({ items, reverse, big }: { items: typeof marketplaces; reverse?: boolean; big?: boolean }) => (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''}`}>
      <div className="marquee__track" style={{ ['--marquee-duration' as string]: reverse ? '38s' : '30s' }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}
            style={{ gap: 'clamp(48px, 6vw, 84px)', paddingInline: 'clamp(48px, 6vw, 84px)' }}>
            {items.map((m) => (
              <li key={m.name} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap ${big ? 'marquee-logo--lg' : ''}`} title={`${m.name} — ver status em Integrações`}>
                <span className="marquee-logo shrink-0"><m.Logo /></span>
                <span className="shrink-0 whitespace-nowrap text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{m.name}</span>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: statusTone[m.status], display: 'inline-block' }} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )

  return (
    <section aria-label="Ecossistema de marketplaces conectados" className="marquee-band--ecosystem">
      <div className="site-container">
        <p className="mb-8 text-center text-[13.5px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>
          Um ecossistema de canais, uma única visão da operação.
        </p>
        <div className="marquee-row"><Row items={rowA} big /></div>
        <div className="marquee-row"><Row items={rowB} reverse /></div>

        {/* Faixa de confiança — compacta, funde no mesmo bloco */}
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-8 sm:grid-cols-4" style={{ borderColor: 'var(--s-line)' }}>
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
      </div>
    </section>
  )
}
