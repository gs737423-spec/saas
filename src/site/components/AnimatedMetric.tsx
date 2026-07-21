import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SiteMetric } from '@/site/data/siteMetrics'

const fmt = new Intl.NumberFormat('pt-BR')

function format(n: number, m: SiteMetric): string {
  const decimals = m.decimals ?? 0
  const body = decimals > 0
    ? n.toFixed(decimals).replace('.', ',')
    : fmt.format(Math.round(n))
  return `${m.prefix ?? ''}${body}${m.suffix ?? ''}`
}

const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Contador real: dispara uma única vez quando ~35% do elemento entra na
// viewport (IntersectionObserver), com fallback por scroll/rect check pra
// ambientes onde IO não é confiável.
function useInViewOnce<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    let done = false
    const finish = () => { if (!done) { done = true; setInView(true) } }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) finish()
    }, { threshold })
    io.observe(el)
    const check = () => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) finish()
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [inView, threshold])
  return { ref, inView }
}

export function AnimatedMetricGroup({ children }: { children: (inView: boolean) => ReactNode }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  return <div ref={ref}>{children(inView)}</div>
}

export default function AnimatedMetric({ metric, run }: { metric: SiteMetric; run: boolean }) {
  const [n, setN] = useState(reducedMotion ? metric.value : 0)
  useEffect(() => {
    if (!run) return
    if (reducedMotion) { setN(metric.value); return }
    let raf = 0
    const dur = 1550
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(metric.value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(metric.value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, metric])

  return <span className="metric__value">{format(n, metric)}</span>
}
