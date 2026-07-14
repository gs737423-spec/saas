/**
 * Motion Design System — Skeleton primitive.
 *
 * Reusable loading placeholder built on the `.motion-skeleton` CSS class
 * (src/styles/motion.css). Not rendered anywhere yet — infrastructure for
 * a future loading-state pass.
 */
export default function Skeleton({
  className = '',
  rounded = 'rounded-lg',
}: {
  className?: string
  rounded?: string
}) {
  return <div className={`motion-skeleton ${rounded} ${className}`} aria-hidden="true" />
}
