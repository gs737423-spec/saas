import { Link } from 'react-router-dom'

// Brand block for the top nav: wordmark only (no icon mark). Kept as its own
// component so the identity (sizing, type hierarchy) lives in one place
// instead of being inlined and re-tweaked inside TopNav.
export default function Brand() {
  return (
    <Link to="/app" className="group flex shrink-0 items-center gap-2.5">
      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <span className="truncate text-[17px] font-extrabold leading-none tracking-tight text-text-primary md:text-lg">
          Vintec
        </span>
      </div>
    </Link>
  )
}
