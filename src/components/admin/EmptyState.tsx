import type { LucideIcon } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-10 text-center">
      <Icon className="h-10 w-10 text-text-muted/40" strokeWidth={1.5} />
      <div>
        <p className="text-[15px] font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
      </div>
    </div>
  )
}
