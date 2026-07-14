import { useState } from 'react'
import { TrendingUp, TrendingDown, Trophy, Percent, Receipt, AlertTriangle, Flame } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'

// Mini gráfico de evolução (área) — proporção correta, dados reais do sistema.
function EvolutionChart() {
  const pts = [80, 88.5, 96, 104.5, 114, 123, 132.5, 127, 139, 151.5, 189, 215]
  const w = 320, h = 90, max = 215, min = 70
  const x = (i: number) => (i / (pts.length - 1)) * w
  const y = (v: number) => h - ((v - min) / (max - min)) * (h - 10) - 4
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="evo2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C82F7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4C82F7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#evo2)" />
      <path d={line} fill="none" stroke="#6FA0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Metric({ label, value, meta, up }: { label: string; value: string; meta?: string; up?: boolean }) {
  return (
    <div className="site-dark-card p-4">
      <div className="text-[11.5px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--s-dark-ink)' }}>{value}</div>
      {meta && (
        <div className="mt-0.5 flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: up ? 'var(--s-emerald)' : 'var(--s-rose)' }}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{meta}
        </div>
      )}
    </div>
  )
}

const channels = [
  { name: 'Mercado Livre', color: '#F5C518', part: 42, margin: '33%', fat: 'R$ 119.500' },
  { name: 'Shopee', color: '#EE4D2D', part: 22, margin: '38%', fat: 'R$ 62.600' },
  { name: 'Loja Própria', color: '#4C82F7', part: 20, margin: '41%', fat: 'R$ 56.900' },
  { name: 'Amazon', color: '#FF9900', part: 16, margin: '30%', fat: 'R$ 45.500' },
]

const attention = [
  { name: 'Porta-Retrato Digital Wi-Fi', tag: 'Em crescimento', tone: '#12B981', trend: 42.3, icon: TrendingUp },
  { name: 'Organizador de Mesa Modular', tag: 'Melhor margem · 62%', tone: '#12B981', trend: 18.9, icon: Percent },
  { name: 'Kit Skincare Premium', tag: 'Maior faturamento', tone: '#4C82F7', trend: 15.3, icon: Flame },
  { name: 'Smartwatch Fitness Tracker', tag: 'Estoque crítico', tone: '#E9A83A', trend: -5.8, icon: AlertTriangle },
  { name: 'Panela Antiaderente Cerâmica', tag: 'Em queda', tone: '#F0466C', trend: -8.1, icon: TrendingDown },
]

const TABS = ['Desempenho', 'Canais', 'Produtos'] as const

export default function IntelligenceSection() {
  const [tab, setTab] = useState(0)

  return (
    <section id="inteligencia" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-6">
        <div className="site-dark overflow-hidden" style={{ borderRadius: 'var(--s-radius-block)' }}>
          <div className="px-6 py-16 md:px-14 md:py-20">
            <SectionHeader
              tone="dark"
              label="Inteligência da operação"
              title="Controle o que realmente determina o resultado da operação."
              desc="Compare canais, acompanhe margens e identifique os produtos que mais impactam o resultado."
            />

            {/* Seletor interno */}
            <div role="tablist" aria-label="Visões de inteligência" className="mt-8 inline-flex rounded-2xl p-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--s-dark-line)' }}>
              {TABS.map((t, i) => {
                const on = i === tab
                return (
                  <button key={t} role="tab" aria-selected={on} onClick={() => setTab(i)}
                    className="rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors"
                    style={on ? { background: 'linear-gradient(180deg,var(--s-blue-bright),var(--s-blue))', color: '#fff' } : { color: 'var(--s-dark-muted)' }}>
                    {t}
                  </button>
                )
              })}
            </div>

            <div key={tab} className="tab-panel mt-8">
              {/* DESEMPENHO */}
              {tab === 0 && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="md:col-span-2 lg:row-span-2">
                    <div className="site-dark-card flex h-full flex-col justify-between p-6"
                      style={{ background: 'linear-gradient(180deg, rgba(18,185,129,0.14), rgba(255,255,255,0) 46%), linear-gradient(180deg,#122C43,#0B1A2B)', borderColor: '#2A625A' }}>
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>Faturamento líquido</div>
                        <div className="mt-2 text-[40px] font-extrabold leading-none tracking-tight num-glow" style={{ color: 'var(--s-dark-ink)' }}>R$ 231,4 mil</div>
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
                  </div>
                  <Metric label="Faturamento bruto" value="R$ 284,5 mil" meta="+12,5%" up />
                  <Metric label="Pedidos" value="1.847" meta="+8,3%" up />
                  <Metric label="Ticket médio" value="R$ 154,02" meta="+3,8%" up />
                  <Metric label="Margem" value="34,8%" meta="+1,4 p.p." up />
                  <div className="site-dark-card p-4 md:col-span-2 lg:col-span-2" style={{ borderColor: 'rgba(233,168,58,0.3)' }}>
                    <div className="text-[11.5px] font-semibold" style={{ color: 'var(--s-amber)' }}>Estoque crítico</div>
                    <div className="mt-1.5 text-[22px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>3 produtos · ruptura em ≤ 5 dias</div>
                  </div>
                </div>
              )}

              {/* CANAIS */}
              {tab === 1 && (
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                  <div className="site-dark-card p-6">
                    <div className="mb-4 text-[12px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>Participação e margem por canal</div>
                    <div className="space-y-4">
                      {channels.map((c) => (
                        <div key={c.name}>
                          <div className="mb-1 flex items-center justify-between text-[12.5px]">
                            <span className="flex items-center gap-2" style={{ color: 'var(--s-dark-ink)' }}>
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.name}
                            </span>
                            <span style={{ color: 'var(--s-dark-muted)' }}>{c.fat} · margem {c.margin}</span>
                          </div>
                          <div className="overview-track h-2 w-full overflow-hidden rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${c.part}%`, background: c.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, tone: '#4C82F7', label: 'Maior faturamento', value: 'Mercado Livre' },
                      { icon: Percent, tone: '#12B981', label: 'Melhor margem', value: 'Loja Própria · 41%' },
                      { icon: Receipt, tone: '#7C5CF6', label: 'Maior ticket', value: 'Loja Própria' },
                      { icon: AlertTriangle, tone: '#E9A83A', label: 'Atenção', value: 'Amazon · 30%' },
                    ].map((h) => (
                      <div key={h.label} className="site-dark-card p-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${h.tone}22`, color: h.tone }}>
                          <h.icon className="h-4 w-4" />
                        </span>
                        <div className="mt-2.5 text-[11px] font-semibold" style={{ color: 'var(--s-dark-muted)' }}>{h.label}</div>
                        <div className="text-[13.5px] font-bold" style={{ color: 'var(--s-dark-ink)' }}>{h.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUTOS */}
              {tab === 2 && (
                <div className="site-dark-card overflow-hidden">
                  <div className="border-b px-5 py-3 text-[12px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--s-dark-line)', color: 'var(--s-dark-muted)' }}>
                    Produtos que merecem atenção
                  </div>
                  <ul>
                    {attention.map((it) => (
                      <li key={it.name} className="flex items-center gap-3 border-b px-5 py-3.5 last:border-0" style={{ borderColor: 'var(--s-dark-line)' }}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${it.tone}22`, color: it.tone }}>
                          <it.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold" style={{ color: 'var(--s-dark-ink)' }}>{it.name}</div>
                          <div className="text-[11.5px]" style={{ color: it.tone }}>{it.tag}</div>
                        </div>
                        <div className="flex items-center gap-0.5 text-[12.5px] font-semibold" style={{ color: it.trend >= 0 ? 'var(--s-emerald)' : 'var(--s-rose)' }}>
                          {it.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {it.trend > 0 ? '+' : ''}{it.trend.toString().replace('.', ',')}%
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
