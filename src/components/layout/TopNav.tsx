import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Wallet,
  FileBarChart2,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  ArrowLeft,
  Building2,
  Plug,
  Headset,
  Eye,
  Inbox,
  X,
  LifeBuoy,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePeriod } from '@/contexts/PeriodContext'
import { useDemoMode } from '@/contexts/DemoModeContext'
import { useViewAs } from '@/contexts/ViewAsContext'
import { apiFetch } from '@/lib/apiFetch'
import { useLeadsCount } from '@/lib/useLeadsCount'
import Brand from '@/components/layout/Brand'
import SearchMenu from '@/components/layout/SearchMenu'
import NotificationsMenu from '@/components/layout/NotificationsMenu'
import PeriodDropdown from '@/components/common/PeriodDropdown'

type Item = { icon: typeof Package; label: string; to: string; badge?: number }

const navItems: Item[] = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/app' },
  { icon: Store, label: 'Marketplaces', to: '/app/marketplaces' },
  { icon: Package, label: 'Produtos', to: '/app/produtos' },
  { icon: Boxes, label: 'Estoque', to: '/app/estoque' },
  { icon: Wallet, label: 'Financeiro', to: '/app/financeiro' },
  { icon: Plug, label: 'Conexões', to: '/app/importacoes' },
  { icon: FileBarChart2, label: 'Relatórios', to: '/app/relatorios' },
  { icon: LifeBuoy, label: 'Suporte', to: '/app/suporte' },
]

// Nav do Painel Admin — vive na MESMA barra global (nunca uma segunda
// barra abaixo). "Clientes" é a lista real de empresas; os demais ainda
// não têm tela própria e ficam desabilitados (link morto é pior que
// ausência de link).
function buildAdminNavItems(leadsCount: number, openTicketsCount: number): (Item | { icon: typeof Package; label: string; disabled: true })[] {
  return [
    { icon: LayoutDashboard, label: 'Visão Geral', to: '/app/admin' },
    { icon: Inbox, label: 'Solicitações', to: '/app/admin/solicitacoes', badge: leadsCount || undefined },
    { icon: Building2, label: 'Clientes', to: '/app/admin/clientes' },
    { icon: Headset, label: 'Suporte', to: '/app/admin/suporte', badge: openTicketsCount || undefined },
    { icon: Plug, label: 'Integrações', disabled: true },
    { icon: ShieldCheck, label: 'Segurança', to: '/app/admin/seguranca' },
  ]
}

// Unified top navigation bar. Replaces the old fixed sidebar (SideRail) on
// desktop, and the slim brand-only bar on mobile. Mobile section links still
// live in BottomNav; here on mobile we only show brand + actions.
// Deriva um nome de exibição a partir do e-mail (Supabase User não tem campo
// `name` por padrão — só metadados opcionais que ainda não configuramos).
function displayNameFromEmail(email: string | undefined): string {
  if (!email) return 'Usuário'
  const local = email.split('@')[0]
  return local
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { options, periodKey, setPeriodKey } = usePeriod()
  const { demoMode, enterDemoMode, exitDemoMode } = useDemoMode()
  const { viewAs, exitViewAs } = useViewAs()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [openTicketsCount, setOpenTicketsCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAdminArea = location.pathname.startsWith('/app/admin')
  const leadsCount = useLeadsCount(isAdmin)

  function handleToggleDemo() {
    if (demoMode) {
      exitDemoMode()
      navigate('/app/admin')
    } else {
      enterDemoMode()
      navigate('/app')
    }
  }

  useEffect(() => {
    // Reaproveita /api/admin/companies em vez de um endpoint /api/admin/me
    // dedicado — Vercel Hobby tem teto de 12 serverless functions por
    // deploy, cada arquivo em api/** conta como uma. 200 = é admin.
    apiFetch('/api/admin/companies').then((res) => setIsAdmin(res.ok)).catch(() => setIsAdmin(false))
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    apiFetch('/api/admin/support-tickets?status=aberto')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { ok: boolean; openCount?: number } | null) => setOpenTicketsCount(body?.ok ? (body.openCount ?? 0) : 0))
      .catch(() => setOpenTicketsCount(0))
  }, [isAdmin])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const displayName = displayNameFromEmail(user?.email)
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rail-item topnav-item group relative flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-semibold tracking-[-0.01em] ${
      isActive ? 'topnav-item-active' : ''
    }`

  return (
    <header
      className="topnav-surface fixed inset-x-0 top-0 z-40 flex items-center gap-1.5 border-b border-border-subtle px-3 md:px-4 lg:px-6"
      style={{ height: 'var(--app-header-height)' }}
    >
      <Brand />

      <span className="mx-1 hidden h-6 w-px shrink-0 bg-border-subtle md:block" />

      {/* Área admin — nunca mostra a navegação de cliente (Marketplaces,
          Produtos etc. levam a dados ilustrativos, sem sentido aqui dentro).
          Só um indicador + volta pra plataforma. */}
      {isAdminArea ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <nav className="topnav-navigation-shell hide-scrollbar mr-auto flex min-w-0 items-center gap-0.5 overflow-x-auto">
            {buildAdminNavItems(leadsCount, openTicketsCount).map((item) =>
              'disabled' in item ? (
                <span
                  key={item.label}
                  title="Em breve"
                  className="topnav-item flex h-9 shrink-0 cursor-not-allowed items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-semibold opacity-35"
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
                </span>
              ) : (
                <NavLink key={item.label} to={item.to} end title={item.label} className={linkClass}>
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
                  {Boolean(item.label === 'Solicitações' ? leadsCount : item.badge) && (
                    <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent-rose px-1 text-[9px] font-bold text-white">
                      {item.label === 'Solicitações' ? leadsCount : item.badge}
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </div>
      ) : (
        <>
          {/* Section nav — desktop only, all items on one line, no horizontal scroll */}
          <nav className="topnav-navigation-shell hide-scrollbar mr-auto hidden min-w-0 items-center gap-0.5 overflow-x-auto md:flex">
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.to} end={item.to === '/app'} title={item.label} className={linkClass}>
                <item.icon className="h-[15px] w-[15px] shrink-0" />
                <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Spacer keeps actions pinned right on mobile, where nav is hidden */}
          <div className="min-w-0 flex-1 md:hidden" />
        </>
      )}

      {/* Actions cluster */}
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <PeriodDropdown options={options} selectedKey={periodKey} onChange={setPeriodKey} variant="icon" />
        {!isAdminArea && (
          <>
            <SearchMenu />
            <NotificationsMenu />
          </>
        )}

        {isAdminArea && (
          <button
            type="button"
            onClick={handleToggleDemo}
            title="Abre a plataforma do cliente com dados ilustrativos, pra demonstração"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-2 py-1.5"
            aria-pressed={demoMode}
          >
            <Eye className="hidden h-3.5 w-3.5 text-text-muted sm:block" />
            <span className={`relative h-4.5 w-8 shrink-0 rounded-full transition-colors ${demoMode ? 'bg-accent-primary' : 'bg-border-subtle'}`}>
              <span
                className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  demoMode ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className="hidden text-[11.5px] font-medium text-text-secondary lg:inline">Demonstração</span>
          </button>
        )}

        {!isAdminArea && demoMode && (
          <button
            type="button"
            onClick={handleToggleDemo}
            title="Sair do modo demonstração e voltar pro painel admin"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card/60 px-2.5 py-1.5 text-[11.5px] font-medium text-text-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Demonstração</span>
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {!isAdminArea && viewAs && (
          <button
            type="button"
            onClick={() => { exitViewAs(); navigate(`/app/admin/empresa/${viewAs.companyId}`) }}
            title={`Visualizando como ${viewAs.companyName} (dado real, somente leitura) — sair`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2.5 py-1.5 text-[11.5px] font-medium text-accent-primary"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visualizando: {viewAs.companyName}</span>
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-border-subtle sm:block" />

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="motion-header-control hidden h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted hover:text-text-primary sm:flex"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <NavLink
          to="/app/configuracoes"
          title="Configurações"
          className={({ isActive }) =>
            `motion-header-control hidden h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted hover:text-text-primary sm:flex ${
              isActive ? 'text-accent-primary' : ''
            }`
          }
        >
          <Settings className="h-[18px] w-[18px]" />
        </NavLink>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            title={displayName}
            className="motion-header-control flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-accent-blue/25 bg-bg-elevated text-xs font-bold text-accent-blue"
          >
            {initials}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
                <p className="truncate text-[11px] text-text-muted">{user?.email}</p>
              </div>
              {!isAdminArea && (
                <NavLink
                  to="/app/configuracoes"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                >
                  <User className="h-4 w-4" />
                  Minha Conta
                </NavLink>
              )}
              {isAdmin && !isAdminArea && (
                <NavLink
                  to="/app/admin"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium text-accent-primary transition-colors hover:bg-white/5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Administração
                </NavLink>
              )}
              {isAdminArea && (
                <NavLink
                  to="/app"
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar à plataforma
                </NavLink>
              )}
              <button
                onClick={() => { setShowUserMenu(false); void signOut().then(() => navigate('/')) }}
                className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border-subtle px-4 py-2.5 text-[12.5px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
