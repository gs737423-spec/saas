import { ArrowRight, TrendingUp, Store, PackageX, MessageCircle } from 'lucide-react'
import BrowserFrame from '@/site/components/BrowserFrame'
import { whatsappDemoUrl } from '@/lib/whatsapp'

function FloatCard({
  icon, label, value, meta, tone, float, className = '',
}: {
  icon: React.ReactNode; label: string; value: string
  meta?: string; tone: string; float: 'a' | 'b'; className?: string
}) {
  return (
    <div className={`site-card glow-on-hover absolute ${float === 'a' ? 'hero-float-a' : 'hero-float-b'} ${className}`}
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

// Hero vende decisão, não centralização. Dashboard como protagonista visual,
// no máximo 2 cards flutuantes (sem margem/CMV — não entregues hoje).
// Ambientação: halos difusos respirando devagar atrás da moldura (CSS puro,
// sem JS por frame), reforçando profundidade sem competir com o conteúdo.
export default function Hero() {
  const waHref = whatsappDemoUrl()

  return (
    <section id="topo" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(1000px 540px at 82% -10%, rgba(76,130,247,0.16), transparent 62%), radial-gradient(760px 540px at 2% 4%, rgba(124,92,246,0.1), transparent 58%)' }} />
      <div className="site-container relative grid items-center gap-10 py-9 md:py-10 lg:grid-cols-[40fr_60fr] lg:gap-12 lg:py-12">
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
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: 'rgba(18,185,129,0.1)', border: '1px solid rgba(18,185,129,0.25)', color: '#0E8F63' }}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Produto — protagonista, com halos de profundidade atrás da moldura */}
        <div className="relative">
          <div className="relative">
            <span aria-hidden="true" className="ambient-halo" style={{ width: 260, height: 260, top: -40, right: -30, background: 'radial-gradient(circle, rgba(76,130,247,0.30), transparent 70%)' }} />
            <span aria-hidden="true" className="ambient-halo" style={{ width: 220, height: 220, bottom: -30, left: -20, background: 'radial-gradient(circle, rgba(124,92,246,0.22), transparent 70%)', animationDelay: '2.5s' }} />
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
