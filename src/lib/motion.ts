/**
 * Motion Design System — JS/TS helpers.
 *
 * Companion to src/styles/motion-tokens.css and src/styles/motion.css.
 * Nothing here is imported by any page or component yet — this module
 * exists so the next phase (actually animating things) has a single,
 * tested place to pull from instead of writing bespoke logic per screen.
 *
 * See motion-system.md for usage guidance and rules.
 */

import { useEffect, useRef, useState } from 'react'

/** Mirrors the CSS custom properties in motion-tokens.css, in ms/units JS can use directly. */
export const motionTokens = {
  duration: {
    ultrafast: 100,
    fast: 160,
    normal: 240,
    slow: 400,
  },
  easing: {
    // Same curves as the CSS tokens, expressed for JS-driven animation
    // (Web Animations API, Recharts animationEasing props, etc).
    standard: [0.4, 0, 0.2, 1] as const,
    enter: [0.16, 1, 0.3, 1] as const,
    exit: [0.7, 0, 0.84, 0] as const,
    hover: [0.22, 1, 0.36, 1] as const,
    button: [0.34, 1.56, 0.64, 1] as const,
  },
  stagger: {
    step: 40,
  },
} as const

/**
 * Returns per-item delays (ms) for a staggered entrance of `count` items.
 * Pure function — no DOM, no timers. Apply the delay via inline
 * `style={{ transitionDelay: \`${delay}ms\` }}` alongside a `.motion-fade`
 * / `.motion-slide` / `.motion-scale` class.
 *
 * Not used anywhere yet.
 */
export function staggerDelays(count: number, stepMs: number = motionTokens.stagger.step): number[] {
  return Array.from({ length: count }, (_, i) => i * stepMs)
}

/** Same as staggerDelays, but as a lookup keyed by index — convenient for `.map()`. */
export function staggerDelayFor(index: number, stepMs: number = motionTokens.stagger.step): number {
  return index * stepMs
}

/**
 * Respects the user's OS-level reduced-motion preference. Motion utilities
 * that drive JS-based animation (as opposed to the CSS `prefers-reduced-motion`
 * block in motion.css) should check this before animating.
 *
 * Not used anywhere yet.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Animates a number from its previous value to `value` over `durationMs`,
 * for KPI-style counters. Ease matches motionTokens.easing.enter. Skips
 * the animation entirely under prefers-reduced-motion.
 *
 * Pair with the `.motion-number` CSS class (tabular-nums + will-change)
 * on the element that renders the returned value.
 *
 * Not used anywhere yet.
 */
export function useAnimatedNumber(value: number, durationMs: number = motionTokens.duration.slow): number {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | undefined>(undefined)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const to = value
    if (from === to) return

    const start = performance.now()
    const [x1, y1, x2, y2] = motionTokens.easing.enter
    const easeEnter = cubicBezier(x1, y1, x2, y2)

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const eased = easeEnter(t)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, reduced])

  return display
}

/** Minimal cubic-bezier(t) solver — avoids pulling in a dependency for one curve. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sampleCurveX = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const sampleCurveY = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t

  return function bezier(x: number): number {
    // Binary search for t given x (good enough precision for UI easing).
    let lo = 0
    let hi = 1
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      if (sampleCurveX(mid) < x) lo = mid
      else hi = mid
    }
    return sampleCurveY((lo + hi) / 2)
  }
}

/**
 * Chart entrance helper: given a target array of values, returns a version
 * that starts at 0 (or a supplied floor) so a chart lib can animate from
 * baseline to actual values using its own animation prop (e.g. Recharts'
 * `isAnimationActive` + `animationDuration`) — this just standardizes the
 * duration/easing that should be passed alongside it.
 *
 * Not used anywhere yet.
 */
export function chartAnimationProps(durationMs: number = motionTokens.duration.slow) {
  return {
    isAnimationActive: true,
    animationDuration: durationMs,
    animationEasing: 'ease-out' as const,
  }
}
