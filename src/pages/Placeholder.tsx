import { Construction } from 'lucide-react'

export default function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel glass-panel-hover group relative w-full max-w-lg overflow-hidden rounded-2xl p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90" style={{ background: 'radial-gradient(circle, #3568F540, transparent 68%)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ background: 'radial-gradient(circle, #9061F922, transparent 70%)' }} />

        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#3568F514', boxShadow: '0 0 24px -5px #3568F599, inset 0 0 0 1px #3568F533' }}>
          <Construction className="h-7 w-7 text-accent-blue" />
        </div>

        <h2 className="relative text-xl font-bold tracking-tight text-text-primary">{title}</h2>
        <span className="relative mt-2 inline-block rounded-full border border-accent-amber/20 bg-accent-amber/10 px-3 py-1 text-[11px] font-semibold text-accent-amber">
          Módulo em desenvolvimento
        </span>
        <p className="relative mx-auto mt-4 max-w-sm text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
    </div>
  )
}
