import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Globe, FileText, Loader2, CheckCircle2, XCircle, Trash2, UserX, Save, Wifi, WifiOff,
  Users2, ShieldCheck, Settings, Headset, CreditCard, Plug, AlertTriangle, Activity, PenLine,
  UserCog, MessageCircle, PhoneCall, Ticket, Clock3, Star, ShieldAlert, Copy, LogIn, ChevronRight, TrendingUp,
} from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import { hueFor, initialsFor, timeAgo } from '@/lib/adminUi'
import AdminSidebar, { type AdminCompanyTab } from '@/components/admin/AdminSidebar'
import HealthScoreRing from '@/components/admin/HealthScoreRing'
import { LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLojaPropria } from '@/site/logos'

const TAB_ORDER: AdminCompanyTab[] = ['visao-geral', 'acessos', 'integracoes', 'cobranca', 'suporte', 'configuracoes']

const TAB_LABEL: Record<AdminCompanyTab, string> = {
  'visao-geral': 'Visão Geral',
  acessos: 'Acessos',
  integracoes: 'Integrações',
  cobranca: 'Cobrança',
  suporte: 'Suporte',
  configuracoes: 'Configurações',
}

interface Company {
  id: string
  name: string
  createdAt: string
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  cnpj: string | null
  whatsapp: string | null
  website: string | null
  status: string
  memberCount: number
}

const STATUS_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'ativo', label: 'Ativa' },
  { value: 'em_risco', label: 'Em risco' },
  { value: 'suspenso', label: 'Suspensa' },
]

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ativo: { label: 'Ativa', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
  em_risco: { label: 'Em risco', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  suspenso: { label: 'Suspensa', color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
}

// Só Mercado Livre tem integração real hoje — os outros 3 aparecem como "não
// existe ainda" (verdade, não é mock) até virarem integrações de verdade.
// Logos reais (src/site/logos.tsx), não ícone genérico.
const OTHER_MARKETPLACES: { name: string; Logo: () => React.JSX.Element }[] = [
  { name: 'Shopee', Logo: LogoShopee },
  { name: 'Amazon', Logo: LogoAmazon },
  { name: 'Loja Própria', Logo: LogoLojaPropria },
]

interface ActivityEntry {
  id: string
  companyId: string | null
  provider: string
  eventType: string
  status: 'info' | 'success' | 'error'
  message: string | null
  createdAt: string
}

// Score derivado de sinais reais (integração conectada, tem acesso vinculado,
// status da conta) — nunca um número solto. Ver HealthScoreRing.
function computeHealthScore(company: Company, memberCount: number, connected: boolean): number {
  let score = 35
  if (connected) score += 35
  if (memberCount > 0) score += 20
  if (company.status === 'ativo') score += 10
  return Math.min(100, score)
}

interface Member {
  userId: string
  email: string | null
  role: string
  addedAt: string
}

interface IntegrationStatus {
  status: string
  productsCount: number
  inventoryCount: number
  ordersCount: number
  lastSyncAt: string | null
}

type Feedback = { type: 'success' | 'error'; text: string } | null

export default function AdminCompany() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('ativo')
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<Feedback>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState<Feedback>(null)

  const [integration, setIntegration] = useState<IntegrationStatus | null>(null)
  const [loadingIntegration, setLoadingIntegration] = useState(true)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [tab, setTab] = useState<AdminCompanyTab>('visao-geral')

  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const loadCompany = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/companies')
      const body = (await res.json().catch(() => null)) as { ok: boolean; companies?: Company[] } | null
      if (res.ok && body?.ok) {
        const found = (body.companies ?? []).find((c) => c.id === id) ?? null
        if (!found) {
          setNotFound(true)
        } else {
          setCompany(found)
          setName(found.name)
          setContactEmail(found.contactEmail ?? '')
          setContactPhone(found.contactPhone ?? '')
          setNotes(found.notes ?? '')
          setCnpj(found.cnpj ?? '')
          setWhatsapp(found.whatsapp ?? '')
          setWebsite(found.website ?? '')
          setStatus(found.status ?? 'ativo')
        }
        setUnauthorized(false)
        setConfigMissing(false)
      } else if (res.status === 503) {
        setConfigMissing(true)
      } else {
        setUnauthorized(true)
      }
    } catch {
      setUnauthorized(true)
    }
    setLoading(false)
  }, [id])

  const loadMembers = useCallback(async () => {
    if (!id) return
    setLoadingMembers(true)
    const res = await apiFetchJson<{ ok: boolean; members: Member[] }>(`/api/admin/members?companyId=${id}`)
    setMembers(res?.members ?? [])
    setLoadingMembers(false)
  }, [id])

  const loadIntegration = useCallback(async () => {
    if (!id) return
    setLoadingIntegration(true)
    const res = await apiFetchJson<IntegrationStatus & { ok: boolean }>(`/api/integrations/status?company_id=${id}`)
    setIntegration(res?.ok ? res : null)
    setLoadingIntegration(false)
  }, [id])

  const loadActivity = useCallback(async () => {
    if (!id) return
    setLoadingActivity(true)
    const res = await apiFetchJson<{ ok: boolean; activity: ActivityEntry[] }>('/api/admin/activity?limit=50')
    setActivity((res?.activity ?? []).filter((a) => a.companyId === id))
    setLoadingActivity(false)
  }, [id])

  useEffect(() => {
    loadCompany()
    loadMembers()
    loadIntegration()
    loadActivity()
  }, [loadCompany, loadMembers, loadIntegration, loadActivity])

  async function handleToggleStatus() {
    if (!id) return
    const nextStatus = status === 'suspenso' ? 'ativo' : 'suspenso'
    setTogglingStatus(true)
    try {
      const res = await apiFetchJson<{ ok: boolean }>('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, contactEmail, contactPhone, notes, cnpj, whatsapp, website, status: nextStatus }),
      })
      if (res?.ok) {
        setStatus(nextStatus)
        loadCompany()
      }
    } finally {
      setTogglingStatus(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setSaveFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, contactEmail, contactPhone, notes, cnpj, whatsapp, website, status }),
      })
      if (res?.ok) {
        setSaveFeedback({ type: 'success', text: 'Salvo.' })
        loadCompany()
      } else {
        setSaveFeedback({ type: 'error', text: res?.message ?? 'Erro ao salvar.' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || !id) return
    setInviting(true)
    setInviteFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; invited?: boolean }>('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), companyId: id }),
      })
      if (res?.ok) {
        setInviteFeedback({ type: 'success', text: res.invited ? `Convite enviado para ${inviteEmail.trim()}.` : 'Usuário já existia — vinculado.' })
        setInviteEmail('')
        await loadMembers()
        loadCompany()
      } else {
        setInviteFeedback({ type: 'error', text: res?.message ?? 'Erro ao convidar.' })
      }
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!id) return
    setRemovingUserId(userId)
    try {
      const res = await apiFetchJson<{ ok: boolean }>(`/api/admin/members?userId=${userId}&companyId=${id}`, { method: 'DELETE' })
      if (res?.ok) {
        await loadMembers()
        loadCompany()
      }
    } finally {
      setRemovingUserId(null)
    }
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>(`/api/admin/companies?id=${id}`, { method: 'DELETE' })
      if (res?.ok) {
        navigate('/app/admin')
      } else {
        setDeleting(false)
        setConfirmingDelete(false)
      }
    } catch {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (configMissing) {
    return (
      <div className="glass-panel admin-card mx-auto mt-12 max-w-md rounded-2xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Configuração pendente</h2>
        <p className="mt-1.5 text-sm text-text-muted">O servidor ainda não tem as variáveis do Supabase configuradas.</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel admin-card mx-auto mt-12 max-w-md rounded-2xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  if (notFound || !company) {
    return (
      <div className="glass-panel admin-card mx-auto mt-12 max-w-md rounded-2xl p-6 text-center">
        <p className="text-sm text-text-muted">Empresa não encontrada.</p>
        <Link to="/app/admin" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-cyan">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
      </div>
    )
  }

  const isConnected = integration?.status === 'connected'
  const connectedCount = isConnected ? 1 : 0
  const healthScore = computeHealthScore(company, members.length, isConnected)
  const st = STATUS_STYLE[company.status] ?? STATUS_STYLE.ativo

  return (
    <div className="flex flex-col gap-5 pb-10 lg:flex-row lg:gap-6">
      <AdminSidebar activeTab={tab} onTabChange={setTab} />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <Link to="/app/admin" className="flex items-center gap-1.5 transition-colors hover:text-text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Empresas
          </Link>
          <span>/</span>
          <span className="truncate text-text-secondary">{company.name}</span>
          <span>/</span>
          <span className="truncate text-text-primary">{TAB_LABEL[tab]}</span>
        </div>

        {/* Header — identidade, badges reais, ações que existem de verdade */}
        <div className="glass-panel admin-card flex flex-col gap-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold" style={{ background: hueFor(company.id), color: '#081423' }}>
              {initialsFor(company.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight text-text-primary">{company.name}</h1>
                <button type="button" onClick={() => setTab('configuracoes')} title="Editar" className="text-text-muted transition-colors hover:text-text-primary">
                  <PenLine className="h-3.5 w-3.5" />
                </button>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${st.color} ${st.bg}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {st.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">Cliente desde {timeAgo(company.createdAt)} · ID #{company.id.slice(0, 8)}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-text-secondary">
                <span className="rounded-full bg-bg-primary/60 px-2.5 py-1">{members.length} {members.length === 1 ? 'usuário' : 'usuários'}</span>
                <span className="rounded-full bg-bg-primary/60 px-2.5 py-1">{connectedCount}/4 integrações</span>
                {company.contactEmail && <span className="rounded-full bg-bg-primary/60 px-2.5 py-1">{company.contactEmail}</span>}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button type="button" title="Ainda não implementado — depende de fluxo de personificação" disabled className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-xs font-semibold text-text-muted opacity-50">
                <LogIn className="h-3.5 w-3.5" /> Entrar como cliente
              </button>
              {company.whatsapp && (
                <a href={`https://wa.me/55${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-accent-emerald/25 bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald transition-colors hover:bg-accent-emerald/20">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className="flex items-center gap-1.5 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-xs font-semibold text-accent-amber transition-colors hover:bg-accent-amber/20 disabled:opacity-40"
              >
                {togglingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {status === 'suspenso' ? 'Reativar empresa' : 'Suspender empresa'}
              </button>
            </div>
          </div>

          {/* Tab bar secundária — mesma navegação da sidebar, só mais rápida de alcançar com o mouse no topo */}
          <div className="flex items-center gap-1 overflow-x-auto border-t border-border-subtle pt-3">
            {TAB_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  tab === t ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {tab === 'visao-geral' && (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="flex flex-col gap-4">
              <div className="glass-panel admin-card flex items-center justify-between gap-4 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-emerald/10 text-accent-emerald"><TrendingUp className="h-4 w-4" /></span>
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] text-text-muted">Receita (últimos 30 dias) <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[9px] font-semibold uppercase text-text-muted">exemplo</span></p>
                    <p className="text-2xl font-bold tabular-nums text-text-primary">R$ 1.870,45</p>
                    <p className="text-[11px] font-medium text-accent-emerald">↑ 12% vs mês anterior</p>
                  </div>
                </div>
                <svg width="96" height="32" viewBox="0 0 96 32" className="shrink-0 text-accent-emerald" aria-hidden="true">
                  <polyline points="0,26 16,22 32,24 48,14 64,17 80,6 96,4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button type="button" onClick={() => setTab('acessos')} className="glass-panel admin-card glass-panel-hover flex flex-col items-start gap-2 rounded-2xl p-4 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/10 text-accent-violet"><Users2 className="h-4 w-4" /></span>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{members.length}</p>
                  <p className="text-[11px] text-text-muted">acessos vinculados</p>
                </button>
                <button type="button" onClick={() => setTab('integracoes')} className="glass-panel admin-card glass-panel-hover flex flex-col items-start gap-2 rounded-2xl p-4 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan"><Plug className="h-4 w-4" /></span>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{integration?.productsCount ?? 0}</p>
                  <p className="text-[11px] text-text-muted">produtos sincronizados</p>
                </button>
                <button type="button" onClick={() => setTab('integracoes')} className="glass-panel admin-card glass-panel-hover flex flex-col items-start gap-2 rounded-2xl p-4 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue"><Ticket className="h-4 w-4" /></span>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{integration?.ordersCount ?? 0}</p>
                  <p className="text-[11px] text-text-muted">pedidos importados</p>
                </button>
                <button type="button" onClick={() => setTab('integracoes')} className="glass-panel admin-card glass-panel-hover flex flex-col items-start gap-2 rounded-2xl p-4 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-emerald/10 text-accent-emerald"><Wifi className="h-4 w-4" /></span>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{connectedCount}/4</p>
                  <p className="text-[11px] text-text-muted">integrações ativas</p>
                </button>
              </div>

              <div className="glass-panel admin-card rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Marketplaces conectados</h3>
                  <button type="button" onClick={() => setTab('integracoes')} className="flex items-center gap-1 text-[11px] font-medium text-accent-cyan hover:underline">
                    Ver todas as integrações <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-border-subtle">
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="[&>svg]:h-10 [&>svg]:w-10 shrink-0"><LogoMercadoLivre /></div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Mercado Livre</p>
                        <p className="text-[11px] text-text-muted">{integration?.lastSyncAt ? `Última sync ${timeAgo(integration.lastSyncAt)}` : 'sem sync ainda'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-[11px] font-medium ${isConnected ? 'text-accent-emerald' : 'text-text-muted'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-accent-emerald' : 'bg-text-muted'}`} />
                        {isConnected ? 'Operacional' : 'Não conectado'}
                      </span>
                      <button type="button" onClick={() => setTab('integracoes')} className="rounded-lg border border-border-subtle px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-white/5">Ver detalhes</button>
                    </div>
                  </div>
                  {OTHER_MARKETPLACES.map((mp) => (
                    <div key={mp.name} className="flex items-center justify-between py-2.5 opacity-60">
                      <div className="flex items-center gap-2.5">
                        <div className="[&>svg]:h-10 [&>svg]:w-10 shrink-0"><mp.Logo /></div>
                        <p className="text-sm font-medium text-text-primary">{mp.name}</p>
                      </div>
                      <span className="text-[11px] text-text-muted">Integração ainda não existe</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel admin-card rounded-2xl p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <Activity className="h-3.5 w-3.5" /> Atividade recente
                </h3>
                {loadingActivity ? (
                  <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                ) : activity.length === 0 ? (
                  <p className="py-2 text-xs text-text-muted">Nenhuma atividade registrada ainda.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {activity.slice(0, 8).map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5 text-xs">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          a.status === 'success' ? 'bg-accent-emerald' : a.status === 'error' ? 'bg-accent-rose' : 'bg-accent-cyan'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-text-secondary">{a.message ?? a.eventType}</p>
                          <p className="text-[10px] text-text-muted">{timeAgo(a.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="glass-panel admin-card flex items-center gap-4 rounded-2xl p-5">
                <HealthScoreRing score={healthScore} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Saúde da conta</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                    {isConnected ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" /> : <XCircle className="h-3.5 w-3.5 text-accent-rose" />}
                    {isConnected ? 'Integração ok' : 'Sem integração'}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                    {members.length > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" /> : <XCircle className="h-3.5 w-3.5 text-accent-rose" />}
                    {members.length > 0 ? 'Usuários ativos' : 'Sem acesso vinculado'}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                    {status === 'ativo' ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" /> : <XCircle className="h-3.5 w-3.5 text-accent-amber" />}
                    Conta {st.label.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="glass-panel admin-card rounded-2xl p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <AlertTriangle className="h-3.5 w-3.5" /> Alertas e pendências
                </h3>
                <div className="flex flex-col gap-2">
                  {!isConnected && (
                    <div className="flex items-start justify-between gap-2 rounded-lg border border-accent-amber/20 bg-accent-amber/5 p-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-amber" />
                        <span className="text-[11px] text-text-secondary">Sem integração ativa — nenhum marketplace conectado.</span>
                      </div>
                      <button type="button" onClick={() => setTab('integracoes')} className="shrink-0 rounded-md bg-accent-amber/15 px-2 py-1 text-[10px] font-semibold text-accent-amber">Resolver</button>
                    </div>
                  )}
                  {members.length === 0 && (
                    <div className="flex items-start justify-between gap-2 rounded-lg border border-accent-amber/20 bg-accent-amber/5 p-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-amber" />
                        <span className="text-[11px] text-text-secondary">Nenhum acesso vinculado ainda.</span>
                      </div>
                      <button type="button" onClick={() => setTab('acessos')} className="shrink-0 rounded-md bg-accent-amber/15 px-2 py-1 text-[10px] font-semibold text-accent-amber">Resolver</button>
                    </div>
                  )}
                  {isConnected && members.length > 0 && <p className="text-xs text-text-muted">Nenhum alerta no momento.</p>}
                </div>
              </div>

              <div className="glass-panel admin-card rounded-2xl p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  <UserCog className="h-3.5 w-3.5" /> Contato
                </h3>
                <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  <p><span className="text-text-muted">E-mail: </span>{company.contactEmail ?? 'não cadastrado'}</p>
                  <p><span className="text-text-muted">Telefone: </span>{company.contactPhone ?? 'não cadastrado'}</p>
                  <p><span className="text-text-muted">Site: </span>{company.website ?? 'não cadastrado'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'acessos' && (
          <div className="glass-panel admin-card rounded-2xl p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              <Users2 className="h-3.5 w-3.5" />
              Acessos ({members.length})
            </h3>

            {loadingMembers ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            ) : (
              <div className="flex flex-col gap-1 border-b border-border-subtle pb-3">
                {members.length === 0 && <p className="py-1.5 text-xs text-text-muted">Nenhum acesso vinculado ainda.</p>}
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: hueFor(m.userId), color: '#081423' }}>
                      {initialsFor(m.email ?? m.userId)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{m.email ?? m.userId}</span>
                    <span className="shrink-0 text-[10px] text-text-muted">desde {timeAgo(m.addedAt)}</span>
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      disabled={removingUserId === m.userId}
                      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10 disabled:opacity-40"
                    >
                      {removingUserId === m.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleInvite} className="mt-3 flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@cliente.com"
                className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none"
              />
              <button type="submit" disabled={inviting || !inviteEmail.trim()} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/25 disabled:opacity-40">
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Convidar
              </button>
            </form>
            {inviteFeedback && (
              <p className={`mt-2 flex items-center gap-1.5 text-xs ${inviteFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {inviteFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {inviteFeedback.text}
              </p>
            )}
          </div>
        )}

        {tab === 'integracoes' && (
          <div className="flex flex-col gap-4">
            <div className="glass-panel admin-card rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="[&>svg]:h-10 [&>svg]:w-10 shrink-0"><LogoMercadoLivre /></div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Mercado Livre</h3>
                  <span className={`text-[11px] font-medium ${isConnected ? 'text-accent-emerald' : 'text-text-muted'}`}>{isConnected ? 'Operacional' : 'Não conectado'}</span>
                </div>
              </div>
              {loadingIntegration ? (
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              ) : integration ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline gap-6">
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-text-primary">{integration.productsCount}</p>
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">produtos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-text-primary">{integration.inventoryCount}</p>
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">estoque</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-text-primary">{integration.ordersCount}</p>
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">pedidos</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {integration.lastSyncAt ? `Última sync ${timeAgo(integration.lastSyncAt)}` : 'Cliente ainda não conectou nenhum marketplace.'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-muted">Sem dados de integração ainda.</p>
              )}
            </div>

            {OTHER_MARKETPLACES.map((mp) => (
              <div key={mp.name} className="glass-panel admin-card flex items-center justify-between rounded-2xl p-5 opacity-60">
                <div className="flex items-center gap-2.5">
                  <div className="[&>svg]:h-10 [&>svg]:w-10 shrink-0"><mp.Logo /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{mp.name}</h3>
                    <p className="text-[11px] text-text-muted">Integração ainda não existe nesta plataforma</p>
                  </div>
                </div>
                <span className="rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-medium text-text-muted">Em breve</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'cobranca' && (
          <div className="glass-panel admin-card flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
            <CreditCard className="h-6 w-6 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">Cobrança ainda não está conectada</p>
            <p className="max-w-sm text-xs text-text-muted">Plano e valor ficam em "Observações" na aba Configurações por enquanto. Histórico de faturas depende de integrar um provedor de cobrança.</p>
          </div>
        )}

        {tab === 'suporte' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-[11px] font-medium text-accent-amber">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Prévia de layout (exemplo) — sem tabela de tickets/notas no banco ainda.
            </div>

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="flex flex-col gap-4">
                <div className="glass-panel admin-card rounded-2xl p-5">
                  <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <Clock3 className="h-3.5 w-3.5" /> Histórico de atendimento
                  </h3>
                  <div className="flex flex-col gap-2.5 text-xs">
                    {[
                      { title: 'Ligação realizada', by: 'Carlos Silva', desc: 'Dúvida sobre integração Amazon.' },
                      { title: 'Token da Amazon expirou', by: 'Sistema', desc: 'O token de autenticação da Amazon expirou.' },
                      { title: 'Enviado tutorial de integração', by: 'Gabriel Souza', desc: 'Tutorial enviado via WhatsApp sobre integração Shopee.' },
                    ].map((ev) => (
                      <div key={ev.title} className="flex items-start gap-2.5 border-b border-border-subtle/60 pb-2.5 last:border-0">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />
                        <div className="min-w-0">
                          <p className="text-text-primary">{ev.title} <span className="text-text-muted">— {ev.by}</span></p>
                          <p className="text-text-muted">{ev.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel admin-card rounded-2xl p-5">
                  <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <Ticket className="h-3.5 w-3.5" /> Chamados
                  </h3>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: '#418', title: 'Integração Shopee não sincroniza produtos', status: 'Resolvido', color: 'text-accent-emerald bg-accent-emerald/10' },
                      { id: '#412', title: 'Erro ao publicar no Mercado Livre', status: 'Fechado', color: 'text-text-muted bg-bg-primary/60' },
                      { id: '#409', title: 'Solicitação de novo usuário', status: 'Aberto', color: 'text-accent-rose bg-accent-rose/10' },
                    ].map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg px-1.5 py-1.5 text-xs">
                        <span className="text-text-muted">{c.id}</span>
                        <span className="min-w-0 flex-1 truncate px-2 text-text-primary">{c.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.color}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel admin-card grid grid-cols-2 gap-4 rounded-2xl p-5 sm:grid-cols-3">
                  {[
                    { icon: Clock3, label: 'tempo médio resposta', value: '—' },
                    { icon: Star, label: 'satisfação média', value: '—' },
                    { icon: ShieldAlert, label: 'risco de churn', value: '—' },
                  ].map((m) => (
                    <div key={m.label} className="flex flex-col gap-1">
                      <m.icon className="h-4 w-4 text-text-muted" />
                      <p className="text-lg font-bold text-text-primary">{m.value}</p>
                      <p className="text-[10px] text-text-muted">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="glass-panel admin-card rounded-2xl p-5">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Observações internas</h3>
                  <p className="text-xs text-text-secondary">Cliente prefere atendimento via WhatsApp. Nenhuma observação real registrada ainda.</p>
                </div>
                <div className="glass-panel admin-card rounded-2xl p-5">
                  <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <PhoneCall className="h-3.5 w-3.5" /> Atalhos rápidos
                  </h3>
                  <div className="flex flex-col gap-1">
                    {company.whatsapp && (
                      <a href={`https://wa.me/55${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary">
                        <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                      </a>
                    )}
                    {company.contactEmail && (
                      <a href={`mailto:${company.contactEmail}`} className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary">
                        <Mail className="h-3.5 w-3.5" /> Enviar e-mail
                      </a>
                    )}
                    <button type="button" onClick={() => { navigator.clipboard.writeText(company.id) }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary">
                      <Copy className="h-3.5 w-3.5" /> Copiar ID da empresa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'configuracoes' && (
          <>
            <form onSubmit={handleSave} className="glass-panel admin-card flex flex-col gap-3 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Dados de contato</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-border-subtle bg-bg-primary/40 px-2 py-1 text-[11px] font-medium text-text-primary focus:border-accent-cyan/50 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">Nome</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary focus:border-accent-cyan/50 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">CNPJ</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/45 focus:outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">E-mail de contato</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contato@cliente.com" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/45 focus:outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">Telefone</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(11) 90000-0000" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/45 focus:outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">WhatsApp</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 90000-0000" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/45 focus:outline-none" />
                  </div>
                  {whatsapp && (
                    <a href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 w-fit text-[10px] text-accent-emerald hover:underline">
                      abrir conversa
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-text-muted">Site</label>
                  <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="cliente.com.br" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/45 focus:outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-text-muted">Observações (plano, valor, data do contrato...)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:opacity-40">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar
                </button>
                {saveFeedback && (
                  <span className={`flex items-center gap-1.5 text-xs ${saveFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {saveFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {saveFeedback.text}
                  </span>
                )}
              </div>
            </form>

            <div className="rounded-2xl border border-accent-rose/20 p-5">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent-rose">Zona de risco</h3>
              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-accent-rose/25 bg-accent-rose/10 px-3 py-2 text-xs font-semibold text-accent-rose transition-colors hover:bg-accent-rose/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir empresa
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-accent-rose/30 bg-accent-rose/5 p-3">
                  <p className="text-xs text-text-secondary">
                    Confirma excluir <strong className="text-text-primary">{company.name}</strong>? Remove os acessos vinculados. Não pode ser desfeito.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 rounded-lg bg-accent-rose px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-rose/90 disabled:opacity-40">
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Sim, excluir
                    </button>
                    <button onClick={() => setConfirmingDelete(false)} disabled={deleting} className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white/5">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
