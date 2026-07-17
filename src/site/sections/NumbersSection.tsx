import { useEffect, useRef, useState } from 'react'
import { Users, CircleDollarSign, ClipboardCheck, Activity, UserCheck, Network, type LucideIcon } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { about, institutionalMetrics, institutionalMetricsTitle, type InstitutionalMetric } from '@/site/content'

const metricIcons: Record<InstitutionalMetric['icon'], LucideIcon> = {
  users: Users,
  gmv: CircleDollarSign,
  orders: ClipboardCheck,
  uptime: Activity,
  team: UserCheck,
  channels: Network,
}

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function fmt(n: number, m: InstitutionalMetric): string {
  if (m.thousands) return Math.round(n).toLocaleString('pt-BR')
  return n.toFixed(m.decimals).replace('.', ',')
}

// Número institucional grande com count-up único ao entrar na viewport.
function MetricValue({ m, run }: { m: InstitutionalMetric; run: boolean }) {
  const [n, setN] = useState(prefersReduced ? m.value : 0)
  useEffect(() => {
    if (!run || prefersReduced) { if (run) setN(m.value); return }
    let raf = 0
    const dur = 1000
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setN(m.value * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(m.value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, m])
  return <span className="metric__value">{m.prefix}{fmt(n, m)}{m.suffix}</span>
}

// Seção "Quem Somos" + números (2 colunas). Fundo off-white. Números são
// PLACEHOLDERS de demonstração (ver content.tsx).
export default function NumbersSection() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    let done = false
    const check = () => {
      if (done) return
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        done = true
        setRun(true)
        window.removeEventListener('scroll', check)
        window.removeEventListener('resize', check)
      }
    }
    check()
    const raf = requestAnimationFrame(check)
    const t = window.setTimeout(check, 400)
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <section id="sobre" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight grid gap-14 py-16 md:py-[72px] lg:grid-cols-[45fr_55fr] lg:gap-24">
        {/* Esquerda — Quem Somos */}
        <Reveal>
          <h2 className="font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(2rem, 3vw, 2.55rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            {about.title}
          </h2>
          <div className="mt-5 space-y-4" style={{ maxWidth: 520 }}>
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} style={{ color: '#46586b', fontSize: 'clamp(1rem, 1.15vw, 1.08rem)', lineHeight: 1.55 }}>{p}</p>
            ))}
          </div>
        </Reveal>

        {/* Direita — números */}
        <Reveal delay={80}>
          <h3 className="mb-8 font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(1.55rem, 2.1vw, 1.9rem)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {institutionalMetricsTitle}
          </h3>
          <div ref={gridRef} className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3">
            {institutionalMetrics.map((m) => {
              const Icon = metricIcons[m.icon]
              return (
                <div key={m.caption}>
                  <MetricValue m={m} run={run} />
                  <div className="metric__row">
                    <Icon className="metric__icon h-[30px] w-[30px]" strokeWidth={2} />
                    <span className="metric__caption">{m.caption}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
