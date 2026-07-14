import { useAnimatedNumber, motionTokens } from '@/lib/motion'

interface Props {
  /** Raw numeric value — the thing that actually changes (period switch, filter, etc). */
  value: number
  /** Formats the (possibly mid-animation) numeric value into display text. Must not lose the final precision. */
  format: (v: number) => string
  durationMs?: number
  className?: string
}

/**
 * Drop-in replacement for rendering a formatted KPI number. Counts from the
 * previous value to the new one on change (first mount included), using the
 * Stage 1 `useAnimatedNumber` hook — respects prefers-reduced-motion, cancels
 * its rAF on unmount, and never diverges from the real final value once the
 * animation settles.
 */
export default function AnimatedNumber({ value, format, durationMs = 600, className }: Props) {
  const display = useAnimatedNumber(value, durationMs)
  return (
    <span className={`motion-number ${className ?? ''}`}>
      {format(display)}
    </span>
  )
}
