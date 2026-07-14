import { ArrowRight, TrendingUp, Wallet, Percent, Store } from 'lucide-react'
import BrowserFrame from '@/site/components/BrowserFrame'

// Card flutuante do hero — informação demonstrativa coerente com o sistema.
function FloatCard({
  icon, label, value, meta, tone, float, className = '',
}: {
  icon: React.ReactNode; label: string; value: string
  meta?: string; tone: string; float: 'a' | 'b'; className?: string
}) {
  return (
    <div className={`site-card absolute ${float === 'a' ? 'hero-float-a' : 'hero-float-b'} ${className}`}
      style={{ padding: '11px 13px', borderRadius: 16, minWidth: 150 }}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${tone}1a`, color: tone }}>{icon}</span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--s-muted)' }}>{label}</span>
      </div>
      <div className="mt-1.5 text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>{value}</div>
      {meta && (
        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--s-emerald)' }}>
          <TrendingUp className="h-3 w-3" />{meta}
        </div>
      )}
    </div>
  )
}

export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(900px 480px at 80% -8%, rgba(76,130,247,0.13), transparent 60%), radial-gradient(680px 480px at 4% 6%, rgba(124,92,246,0.08), transparent 55%)' }} />
      <div className="site-container relative grid items-center gap-10 py-14 md:py-16 lg:grid-cols-[46fr_54fr] lg:gap-12 lg:py-20">
        {/* Texto */}
        <div className="max-w-xl">
          <span className="site-label mb-5" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--s-emerald)', display: 'inline-block' }} />
            Plataforma de gestão multicanal
          </span>

          <h1 className="site-display" style={{ color: 'var(--s-ink)' }}>
            Todos os seus marketplaces.{' '}
            <span style={{ color: 'var(--s-blue)' }}>Uma única visão</span> do seu negócio.
          </h1>

          <p className="site-lead mt-5">
            Centralize Mercado Livre, Shopee, Amazon e sua loja própria em um único dashboard para
            acompanhar faturamento, margem, produtos, estoque e desempenho por canal.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#demonstracao" className="btn btn-primary">Solicitar demonstração <ArrowRight className="h-4 w-4" /></a>
            <a href="#plataforma" className="btn btn-ghost">Conhecer a plataforma</a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--s-muted)' }}>
            <span style={{ width: 18, height: 2, background: 'var(--s-line-strong)', display: 'inline-block' }} />
            Conexões por API para uma operação verdadeiramente centralizada.
          </p>
        </div>

        {/* Produto — maior, ~54% */}
        <div className="relative">
          <div className="relative">
            <BrowserFrame
              src="/site/dashboard-overview.webp"
              alt="Painel de Visão Geral da Acelera Intelligence"
              caption="Visão Geral — faturamento, pedidos, margem e canais em um só painel"
              priority
            />
            {/* No máximo 3 cards, sem cobrir o centro */}
            <FloatCard icon={<Wallet className="h-4 w-4" />} label="Faturamento líquido" value="R$ 231,4 mil" meta="+12,5%" tone="#12B981" float="a" className="-left-3 top-10 sm:-left-7" />
            <FloatCard icon={<Store className="h-4 w-4" />} label="Canal líder" value="Mercado Livre" meta="42% de participação" tone="#3D74F0" float="b" className="-right-2 top-3 sm:-right-5" />
            <FloatCard icon={<Percent className="h-4 w-4" />} label="Margem" value="34,8%" tone="#7C5CF6" float="b" className="-left-2 bottom-6 sm:-left-6" />
          </div>
        </div>
      </div>
    </section>
  )
}
