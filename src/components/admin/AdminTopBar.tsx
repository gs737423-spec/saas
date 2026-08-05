import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Plug, Headset, Settings, Eye } from 'lucide-react'

// Nav horizontal do Painel Admin — substitui a antiga AdminSidebar.
// "Clientes" é a lista de empresas real (rota /app/admin). Os outros itens
// ainda não têm tela própria — ficam desabilitados (honestidade > sidebar
// cheia de link morto), exceto Configurações que reaproveita a aba da
// própria empresa quando dentro de uma.
const items = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/app/admin', end: true },
  { icon: Building2, label: 'Clientes', to: '/app/admin', end: true },
  { icon: Plug, label: 'Integrações', disabled: true },
  { icon: Headset, label: 'Consultoria', disabled: true },
  { icon: Settings, label: 'Configurações', disabled: true },
] as const

export default function AdminTopBar() {
  const [demoMode, setDemoMode] = useState(false)

  return (
    <div className="border-b border-border-subtle">
      <div className="flex items-center justify-between gap-4 px-1 py-2">
        <nav className="hide-scrollbar flex items-center gap-1 overflow-x-auto">
          {items.map((item, i) =>
            !('to' in item) ? (
              <span
                key={item.label + i}
                title="Em breve"
                className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-text-muted/40"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.label + i}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    isActive ? 'text-accent-cyan' : 'text-text-muted hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {isActive && <span className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-accent-cyan" />}
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={() => setDemoMode((v) => !v)}
          title="Alterna só o indicador visual — não troca nenhum dado"
          className="flex shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5"
          aria-pressed={demoMode}
        >
          <Eye className="h-3.5 w-3.5 text-text-muted" />
          <span className={`relative h-4.5 w-8 shrink-0 rounded-full transition-colors ${demoMode ? 'bg-accent-cyan' : 'bg-border-subtle'}`}>
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                demoMode ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
          <span className="text-[11.5px] font-medium text-text-secondary">Modo Demonstração</span>
        </button>
      </div>

      {demoMode && (
        <div className="border-t border-accent-cyan/20 bg-accent-cyan/5 px-3 py-1.5 text-center text-[11.5px] font-medium text-accent-cyan">
          Modo demonstração ativo — indicador visual, nenhum dado foi alterado
        </div>
      )}
    </div>
  )
}
