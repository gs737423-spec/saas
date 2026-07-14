import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'

// Mini gráfico de evolução (área) — proporção correta, dados reais do sistema.
function EvolutionChart() {
  const pts = [80, 88.5, 96, 104.5, 114, 123, 132.5, 127, 139, 151.5, 189, 215]
  const w = 300, h = 96, max = 215, min = 70
  const x = (i: number) => (i / (pts.length - 1)) * w
  const y = (v: number) => h - ((v - min) / (max - min)) * (h - 10) - 4
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C82F7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4C82F7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#evo)" />
      <path d={line} fill="none" stroke="#6FA0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Metric({ label, value, meta, up }: { label: string; value: string; meta?: string; up?: boolean }) {
  return (
    <div className="site-dark-card p-5">
      <div className="text-[12px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>{label}</div>
      <div className="mt-2 text-[26px] font-extrabold tracking-tight num-glow" style={{ color: 'var(--s-dark-ink)' }}>{value}</div>
      {meta && (
        <div className="mt-1 flex items-center gap-1 text-[12px] font-semibold"
          style={{ color: up ? 'var(--s-emerald)' : 'var(--s-rose)' }}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{meta}
        </div>
      )}
    </div>
  )
}

export default function MetricsSection() {
  const channels = [
    { name: 'Mercado Livre', pct: 42, color: '#F5C518' },
    { name: 'Shopee', pct: 22, color: '#EE4D2D' },
    { name: 'Loja Própria', pct: 20, color: '#4C82F7' },
    { name: 'Amazon', pct: 16, color: '#FF9900' },
  ]
  return (
    <section style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-6">
        <div className="site-dark overflow-hidden" style={{ borderRadius: 'var(--s-radius-block)' }}>
          <div className="px-6 py-16 md:px-14 md:py-20">
            <SectionHeader
              tone="dark"
              label="Indicadores que importam"
              title="Controle o que realmente determina o resultado da operação."
              desc="Tenha uma visão objetiva dos números que ajudam a entender crescimento, rentabilidade e eficiência."
            />

            <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {/* Indicador principal maior */}
              <Reveal className="md:col-span-2 lg:row-span-2">
                <div className="site-dark-card flex h-full flex-col justify-between p-6"
                  style={{ background: 'linear-gradient(180deg, rgba(18,185,129,0.14), rgba(255,255,255,0) 46%), linear-gradient(180deg,#122C43,#0B1A2B)', borderColor: '#2A625A' }}>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>Faturamento líquido</div>
                    <div className="mt-2 text-[44px] font-extrabold leading-none tracking-tight num-glow" style={{ color: 'var(--s-dark-ink)' }}>R$ 231,4 mil</div>
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--s-emerald)' }}>
                      <TrendingUp className="h-4 w-4" /> +12,5% vs. período anterior
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--s-dark-muted)' }}>
                      <span>Evolução do faturamento</span><span>12 meses</span>
                    </div>
                    <EvolutionChart />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={60}><Metric label="Faturamento bruto" value="R$ 284,5 mil" meta="+12,5%" up /></Reveal>
              <Reveal delay={90}><Metric label="Pedidos" value="1.847" meta="+8,3%" up /></Reveal>
              <Reveal delay={120}><Metric label="Ticket médio" value="R$ 154,02" meta="+3,8%" up /></Reveal>
              <Reveal delay={150}><Metric label="Margem" value="34,8%" meta="+1,4 p.p." up /></Reveal>

              {/* Participação por canal */}
              <Reveal className="md:col-span-2" delay={80}>
                <div className="site-dark-card p-6">
                  <div className="mb-4 text-[12px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>Participação por canal</div>
                  <div className="space-y-3">
                    {channels.map((c) => (
                      <div key={c.name}>
                        <div className="mb-1 flex items-center justify-between text-[12.5px]">
                          <span style={{ color: 'var(--s-dark-ink)' }}>{c.name}</span>
                          <span className="font-bold" style={{ color: 'var(--s-dark-ink)' }}>{c.pct}%</span>
                        </div>
                        <div className="overview-track h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={110}>
                <div className="site-dark-card h-full p-6" style={{ borderColor: 'rgba(233,168,58,0.35)' }}>
                  <div className="text-[12px] font-semibold" style={{ color: 'var(--s-amber)' }}>Estoque crítico</div>
                  <div className="mt-2 text-[26px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>3 produtos</div>
                  <div className="mt-1 text-[12px]" style={{ color: 'var(--s-dark-muted)' }}>ruptura prevista em ≤ 5 dias</div>
                </div>
              </Reveal>

              <Reveal delay={140}>
                <div className="site-dark-card h-full p-6" style={{ borderColor: 'rgba(240,70,108,0.3)' }}>
                  <div className="text-[12px] font-semibold" style={{ color: 'var(--s-rose)' }}>Produtos em queda</div>
                  <div className="mt-2 text-[26px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>2 produtos</div>
                  <div className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: 'var(--s-dark-muted)' }}>
                    <ArrowRight className="h-3.5 w-3.5" /> dependência do ML em 42%
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
