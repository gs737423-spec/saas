import { LayoutDashboard, Building2, UserRound, Plug, CreditCard, Headset, Settings, Headphones } from 'lucide-react'

export type AdminCompanyTab = 'visao-geral' | 'acessos' | 'integracoes' | 'cobranca' | 'suporte' | 'configuracoes'

const GLOBAL_ITEMS = [
  { icon: LayoutDashboard, label: 'Visão Geral' },
  { icon: Building2, label: 'Empresas' },
]

const COMPANY_ITEMS: { icon: typeof LayoutDashboard; label: string; tab: AdminCompanyTab }[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', tab: 'visao-geral' },
  { icon: UserRound, label: 'Acessos', tab: 'acessos' },
  { icon: Plug, label: 'Integrações', tab: 'integracoes' },
  { icon: CreditCard, label: 'Cobrança', tab: 'cobranca' },
  { icon: Headset, label: 'Suporte', tab: 'suporte' },
  { icon: Settings, label: 'Configurações', tab: 'configuracoes' },
]

const itemClass = (active: boolean) =>
  `flex w-full items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-left text-[13px] font-medium transition-colors ${
    active ? 'border-accent-cyan text-accent-cyan' : 'border-transparent text-text-muted hover:bg-white/5 hover:text-text-primary'
  }`

// Sidebar da área /app/admin. Dois modos:
// - Global (lista de empresas): só "Visão Geral" ativo, os demais itens são
//   conceitos por-empresa e não fazem sentido fora de uma empresa aberta.
// - Por empresa (AdminCompany): 6 abas reais, controladas pelo pai via
//   activeTab/onTabChange (troca de conteúdo na mesma página, sem rota nova —
//   as sub-telas Cobrança/Suporte ainda não têm dado real no banco).
export default function AdminSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab?: AdminCompanyTab
  onTabChange?: (tab: AdminCompanyTab) => void
}) {
  const isCompanyContext = Boolean(activeTab && onTabChange)

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-0.5">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Painel Administrativo</p>

      {isCompanyContext
        ? COMPANY_ITEMS.map((item) => (
            <button key={item.tab} type="button" onClick={() => onTabChange?.(item.tab)} className={itemClass(activeTab === item.tab)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))
        : GLOBAL_ITEMS.map((item) => (
            <span key={item.label} className={itemClass(true)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </span>
          ))}

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border-subtle bg-bg-primary/30 px-3 py-2.5">
        <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-text-primary">Precisa de ajuda?</p>
          <p className="text-[11px] text-text-muted">Fale com nosso time</p>
        </div>
      </div>
    </nav>
  )
}
