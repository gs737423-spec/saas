import { ShieldCheck, Building2, RefreshCw, UserCheck } from 'lucide-react'
import { trustStrip } from '@/site/content'

const icons = [ShieldCheck, Building2, RefreshCw, UserCheck]

// Faixa de prova técnica — substitui o antigo marquee de logos. Curta,
// elegante, comunica confiança em vez de repetir marcas de canais que ainda
// não estão todas disponíveis (isso vive na seção de Integrações, com
// status honesto por item).
export default function TrustStrip() {
  return (
    <section aria-label="Prova técnica" className="border-y" style={{ borderColor: 'var(--s-line-strong)', background: 'var(--s-bg-soft)' }}>
      <div className="site-container py-6 md:py-7">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {trustStrip.map((t, i) => {
            const Icon = icons[i]
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
