import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'

const items = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/app/admin', end: true },
  { icon: Building2, label: 'Empresas', to: '/app/admin', end: true },
  { icon: Settings, label: 'Configurações', to: '/app/configuracoes', end: false },
]

// Sidebar só da área /app/admin — navegação de cliente fica fora daqui de
// propósito (ver TopNav.isAdminArea). "Empresas" e "Visão Geral" apontam pro
// mesmo lugar por enquanto (uma tela só) — ficam definidos assim que a lista
// crescer o suficiente pra separar visão-geral de listagem.
export default function AdminSidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
      isActive ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
    }`

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-0.5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Painel Administrativo</p>
      {items.map((item) => (
        <NavLink key={item.label} to={item.to} end={item.end} className={linkClass}>
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
