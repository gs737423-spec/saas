import { Link } from 'react-router-dom'
import markUrl from '@/assets/acelera-mark.png'

// Brand block for the top nav: icon mark + wordmark. Kept as its own
// component so the identity (sizing, glow, type hierarchy) lives in one
// place instead of being inlined and re-tweaked inside TopNav.
export default function Brand() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5">
      <img
        src={markUrl}
        alt="Acelera"
        draggable={false}
        className="brand-mark h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.06] md:h-10 md:w-10"
      />
      <div className="hidden min-w-0 flex-col justify-center gap-0.5 sm:flex">
        <span className="truncate text-[15px] font-bold leading-none tracking-tight text-text-primary md:text-base">
          Acelera
        </span>
        <span className="truncate text-[9.5px] font-semibold uppercase leading-none tracking-[0.16em] text-accent-blue/75">
          Intelligence
        </span>
      </div>
    </Link>
  )
}
