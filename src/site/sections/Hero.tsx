import { ArrowRight, TrendingUp, Store, PackageX } from 'lucide-react'
import BrowserFrame from '@/site/components/BrowserFrame'

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

// Hero vende decisão, não centralização. Dashboard como protagonista visual
// (maior que a versão anterior), no máximo 2 cards flutuantes, nenhum deles
// referencia margem/CMV (não entregues no produto real hoje).
export default function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(900px 480px at 80% -8%, rgba(76,130,247,0.13), transparent 60%), radial-gradient(680px 480px at 4% 6%, rgba(124,92,246,0.08), transparent 55%)' }} />
      <div className="site-container relative grid items-center gap-10 py-14 md:py-16 lg:grid-cols-[40fr_60fr] lg:gap-12 lg:py-20">
        {/* Texto */}
        <div className="max-w-xl">
          <span className="site-label mb-5" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--s-emerald)', display: 'inline-block' }} />
            Plataforma de gestão multicanal
          </span>

          <h1 className="site-display" style={{ color: 'var(--s-ink)' }}>
            A camada de{' '}
            <span style={{ color: 'var(--s-blue)' }}>decisão</span> da sua operação em marketplaces.
          </h1>

          <p className="site-lead mt-5">
            Centralize pedidos, faturamento, produtos e estoque para identificar riscos, oportunidades e
            prioridades sem depender de relatórios separados.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#demonstracao" className="btn btn-primary">Solicitar demonstração <ArrowRight className="h-4 w-4" /></a>
            <a href="#produto" className="btn btn-ghost">Conhecer a plataforma</a>
          </div>
        </div>

        {/* Produto — protagonista, maior área que a versão anterior */}
        <div className="relative">
          <div className="relative">
            <BrowserFrame
              src="/site/dashboard-overview.webp"
              alt="Painel de Visão Geral da plataforma"
              caption="Visão Geral — faturamento, pedidos e canais em um só painel"
              priority
            />
            <FloatCard icon={<Store className="h-4 w-4" />} label="Canal líder" value="Mercado Livre" meta="42% de participação" tone="#3D74F0" float="a" className="-left-3 top-8 sm:-left-7" />
            <FloatCard icon={<PackageX className="h-4 w-4" />} label="Estoque em atenção" value="3 produtos" tone="#E9A83A" float="b" className="-right-2 bottom-6 sm:-right-5" />
          </div>
          <p className="mt-3 text-center text-[11.5px]" style={{ color: 'var(--s-muted)' }}>Dados demonstrativos para ilustração.</p>
        </div>
      </div>
    </section>
  )
}
