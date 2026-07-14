import { TrendingUp, TrendingDown, Flame, Percent, Package, AlertTriangle } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'

const categories = [
  { label: 'Mais vendido', icon: Flame, tone: '#F0466C' },
  { label: 'Maior faturamento', icon: TrendingUp, tone: '#4C82F7' },
  { label: 'Melhor margem', icon: Percent, tone: '#12B981' },
  { label: 'Em crescimento', icon: TrendingUp, tone: '#12B981' },
  { label: 'Em queda', icon: TrendingDown, tone: '#F0466C' },
  { label: 'Estoque crítico', icon: Package, tone: '#E9A83A' },
]

interface Item {
  name: string
  channel: string
  revenue: string
  tag: string
  tagTone: string
  trend: number
  stockWarn?: boolean
}

const items: Item[] = [
  { name: 'Kit Skincare Premium 5 Peças', channel: 'Mercado Livre', revenue: 'R$ 45.200', tag: 'Maior faturamento', tagTone: '#4C82F7', trend: 15.3 },
  { name: 'Porta-Retrato Digital Wi-Fi', channel: 'Shopee', revenue: 'R$ 11.800', tag: 'Em crescimento', tagTone: '#12B981', trend: 42.3, stockWarn: true },
  { name: 'Organizador de Mesa Modular', channel: 'Loja Própria', revenue: 'R$ 16.500', tag: 'Melhor margem · 62%', tagTone: '#12B981', trend: 18.9 },
  { name: 'Smartwatch Fitness Tracker', channel: 'Amazon', revenue: 'R$ 19.700', tag: 'Estoque crítico', tagTone: '#E9A83A', trend: -5.8, stockWarn: true },
  { name: 'Panela Antiaderente Cerâmica', channel: 'Mercado Livre', revenue: 'R$ 9.200', tag: 'Em queda', tagTone: '#F0466C', trend: -8.1 },
]

export default function ProductIntelligence() {
  return (
    <section id="produtos" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="Inteligência de produto"
          title="Identifique oportunidades e riscos antes que eles afetem o caixa."
          desc="A plataforma destaca automaticamente quais produtos estão impulsionando o resultado e quais precisam de atenção."
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
              style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-ink-soft)' }}>
              <c.icon className="h-3.5 w-3.5" style={{ color: c.tone }} /> {c.label}
            </span>
          ))}
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Lista de produtos */}
          <Reveal className="site-card overflow-hidden">
            <div className="border-b px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--s-line)', color: 'var(--s-muted)' }}>
              Produtos que merecem atenção
            </div>
            <ul>
              {items.map((it) => (
                <li key={it.name} className="flex items-center gap-3 border-b px-5 py-3.5 last:border-0" style={{ borderColor: 'var(--s-line)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--s-ink)' }}>{it.name}</span>
                      {it.stockWarn && <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--s-amber)' }} />}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: `${it.tagTone}18`, color: it.tagTone }}>{it.tag}</span>
                      <span className="text-[11.5px]" style={{ color: 'var(--s-muted)' }}>{it.channel}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[14px] font-bold" style={{ color: 'var(--s-ink)' }}>{it.revenue}</div>
                    <div className="flex items-center justify-end gap-0.5 text-[11.5px] font-semibold"
                      style={{ color: it.trend >= 0 ? 'var(--s-emerald)' : 'var(--s-rose)' }}>
                      {it.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {it.trend > 0 ? '+' : ''}{it.trend.toString().replace('.', ',')}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <BrowserFrame
              src="/site/products-overview.webp"
              alt="Página de Produtos com ranking e classificação de desempenho"
              caption="Produtos — ranking, filtros e classificação de desempenho"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
