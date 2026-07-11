import { Search, Bell, Upload } from 'lucide-react'
import logoUrl from '@/assets/acelera-logo.png'

// Mobile-only slim bar. On desktop the SideRail owns all actions and there is
// no top chrome — content starts at the top of the viewport.
export default function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between border-b border-border-subtle bg-bg-secondary/80 px-3 backdrop-blur-2xl md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0a0e1c]">
          <img src={logoUrl} alt="Acelera" className="brand-logo h-full w-full scale-[1.6] object-cover" draggable={false} />
        </div>
        <span className="text-sm font-semibold text-text-primary">Acelera</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button title="Buscar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary">
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button title="Importar / Conectar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-violet/25 bg-accent-violet/[0.12] text-accent-violet transition-colors hover:bg-accent-violet/[0.18]">
          <Upload className="h-[18px] w-[18px]" />
        </button>
        <button title="Notificações" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-rose" />
        </button>
      </div>
    </header>
  )
}
