import { ArrowRight, TrendingUp, TrendingDown, Wallet, Percent, PackageX, Store } from 'lucide-react'
import BrowserFrame from '@/site/components/BrowserFrame'

// Card flutuante do hero — informação demonstrativa coerente com o sistema.
function FloatCard({
  icon,
  label,
  value,
  meta,
  tone,
  float,
  className = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  meta?: { text: string; up?: boolean }
  tone: string
  float: 'a' | 'b'
  className?: string
}) {
  return (
    <div
      className={`site-card absolute ${float === 'a' ? 'hero-float-a' : 'hero-float-b'} ${className}`}
      style={{ padding: '12px 14px', borderRadius: 18, minWidth: 158 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${tone}1a`, color: tone }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--s-muted)' }}>{label}</span>
      </div>
      <div className="mt-2 text-[19px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>{value}</div>
      {meta && (
        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: meta.up ? 'var(--s-emerald)' : 'var(--s-rose)' }}>
          {meta.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {meta.text}
        </div>
      )}
    </div>
  )
}

export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      {/* brilho ambiente suave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 500px at 78% -6%, rgba(76,130,247,0.12), transparent 60%), radial-gradient(700px 500px at 6% 8%, rgba(124,92,246,0.08), transparent 55%)',
        }}
      />
      <div className="site-container relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* Texto */}
        <div className="max-w-xl">
          <span className="site-label mb-5" style={{
            background: 'var(--s-surface)', border: '1px solid var(--s-line)',
            padding: '6px 12px', borderRadius: 999,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--s-emerald)', display: 'inline-block' }} />
            Plataforma de gestão multicanal
          </span>

          <h1 className="site-display" style={{ color: 'var(--s-ink)' }}>
            Todos os seus marketplaces.{' '}
            <span style={{ color: 'var(--s-blue)' }}>Uma única visão</span> do seu negócio.
          </h1>

          <p className="site-lead mt-6">
            Centralize Mercado Livre, Shopee, Amazon e sua loja própria em um dashboard completo para
            acompanhar faturamento, margem, estoque, produtos e o desempenho de cada canal.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#demonstracao" className="btn btn-primary">
              Solicitar demonstração <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#plataforma" className="btn btn-ghost">Conhecer a plataforma</a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--s-muted)' }}>
            <span style={{ width: 18, height: 2, background: 'var(--s-line-strong)', display: 'inline-block' }} />
            Visão centralizada para operações multicanal.
          </p>
        </div>

        {/* Composição visual */}
        <div className="relative">
          <div className="relative mx-auto max-w-[560px]">
            <BrowserFrame
              src="/site/dashboard-overview.webp"
              alt="Painel de Visão Geral da Acelera Intelligence"
              caption="Visão Geral — faturamento, pedidos, margem e canais em um só painel"
              priority
            />

            {/* Cards flutuantes — não cobrem o centro da imagem */}
            <FloatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Faturamento líquido"
              value="R$ 231,4 mil"
              meta={{ text: '+12,5% no período', up: true }}
              tone="#12B981"
              float="a"
              className="-left-4 top-10 sm:-left-8"
            />
            <FloatCard
              icon={<Store className="h-4 w-4" />}
              label="Canal líder"
              value="Mercado Livre"
              meta={{ text: '42% de participação', up: true }}
              tone="#3D74F0"
              float="b"
              className="-right-3 top-2 sm:-right-6"
            />
            <FloatCard
              icon={<Percent className="h-4 w-4" />}
              label="Margem atual"
              value="34,8%"
              tone="#7C5CF6"
              float="b"
              className="-left-3 bottom-8 sm:-left-7"
            />
            <FloatCard
              icon={<PackageX className="h-4 w-4" />}
              label="Estoque crítico"
              value="3 produtos"
              meta={{ text: 'ruptura em ≤ 5 dias', up: false }}
              tone="#E9A83A"
              float="a"
              className="-right-2 bottom-4 sm:-right-5"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
