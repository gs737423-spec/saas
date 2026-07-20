import { ShieldCheck, Building2, Network, UserCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import { marketplaces, trustStrip } from '@/site/content'

const trustIcons = [ShieldCheck, Building2, Network, UserCheck]

// Posições dos 4 nós ao redor do símbolo central (percentuais do palco).
const NODE_POS = [
  { top: '4%', left: '6%' },
  { top: '4%', right: '6%' },
  { bottom: '4%', left: '6%' },
  { bottom: '4%', right: '6%' },
]

function ConnectorLines() {
  // Curvas do centro (50,50) até cada nó — desenhadas em coordenadas de um
  // viewBox 100x100, animam uma vez via stroke-dashoffset ao entrar na tela.
  const paths = [
    'M50,50 C38,38 24,26 14,14',
    'M50,50 C62,38 76,26 86,14',
    'M50,50 C38,62 24,74 14,86',
    'M50,50 C62,62 76,74 86,86',
  ]
  return (
    <svg className="ecosystem-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d) => (
        <path key={d} d={d} className="ecosystem-lines__path" />
      ))}
    </svg>
  )
}

// Ecossistema — rede conectada: símbolo Vintec no centro, os 4 marketplaces em
// nós ao redor ligados por curvas SVG. Faixa marquee de reforço abaixo.
export default function EcosystemMarquee() {
  return (
    <section id="marketplaces" aria-label="Marketplaces atendidos" className="ecosystem-section scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <SectionHeader
          align="center"
          tone="dark"
          label="Ecossistema conectado"
          title="Os principais canais da sua operação, conectados em uma única visão."
          desc="Mercado Livre, Amazon, Shopee e Leroy Merlin organizados para sua equipe acompanhar a operação com mais clareza."
        />

        {/* Rede: símbolo central + 4 nós conectados por curvas (desktop/tablet) */}
        <div className="ecosystem-network">
          <ConnectorLines />
          <div className="ecosystem-network__center" aria-hidden="true">V</div>
          {marketplaces.map((m, i) => (
            <div key={m.name} className="ecosystem-node" style={NODE_POS[i]}>
              <img src={m.logoSrc} alt={m.name} style={{ height: m.logoH, maxWidth: 150 }} />
              <span className="ecosystem-node__caption">Conectado por API</span>
            </div>
          ))}
        </div>

        {/* Mobile: símbolo no topo + grid 2×2 (a rede completa não cabe apertada) */}
        <div className="ecosystem-network-mobile">
          <div className="ecosystem-network__center" style={{ position: 'static', transform: 'none', margin: '0 auto 20px' }} aria-hidden="true">V</div>
          <div className="grid grid-cols-2 gap-3">
            {marketplaces.map((m) => (
              <div key={m.name} className="ecosystem-node" style={{ position: 'static', width: '100%' }}>
                <img src={m.logoSrc} alt={m.name} style={{ height: m.logoH * 0.85, maxWidth: 130 }} />
                <span className="ecosystem-node__caption">Conectado por API</span>
              </div>
            ))}
          </div>
        </div>

        {/* Faixa lenta de reforço */}
        <div className="mt-14 marquee" style={{ opacity: 0.85 }}>
          <div className="marquee__track" style={{ ['--marquee-duration' as string]: '34s' }}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}
                style={{ gap: 'clamp(72px, 8vw, 110px)', paddingInline: 'clamp(48px, 6vw, 84px)' }}>
                {marketplaces.map((m) => (
                  <li key={m.name} className="flex shrink-0 items-center">
                    <img src={m.logoSrc} alt="" style={{ height: m.logoH * 0.9, maxWidth: 140, opacity: 0.85 }} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* Faixa de confiança */}
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-10 vt-hair sm:grid-cols-4">
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
