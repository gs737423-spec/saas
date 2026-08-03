import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Mail, Phone, Plus, ShieldCheck, Settings, Loader2, CheckCircle2, XCircle, Trash2, UserX, Save, Wifi, WifiOff, Search, Users2 } from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'

interface Company {
  id: string
  name: string
  createdAt: string
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  memberCount: number
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

const AVATAR_HUES = ['#46E5FF', '#3BE38E', '#FFC95A', '#FF5E7D', '#3A8DFF']
function hueFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_HUES[h % AVATAR_HUES.length]
}
function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `há ${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Admin() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

  const [search, setSearch] = useState('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [listFeedback, setListFeedback] = useState<Feedback>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadCompanies = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/companies')
      const body = (await res.json().catch(() => null)) as { ok: boolean; companies?: Company[] } | null
      if (res.ok && body?.ok) {
        setCompanies(body.companies ?? [])
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
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!newCompanyName.trim()) return
    setCreatingCompany(true)
    setListFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; company?: Company }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      })
      if (res?.ok) {
        setNewCompanyName('')
        await loadCompanies()
        if (res.company) setSelectedId(res.company.id)
      } else {
        setListFeedback({ type: 'error', text: res?.message ?? 'Erro ao criar empresa.' })
      }
    } finally {
      setCreatingCompany(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return companies
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.contactEmail?.toLowerCase().includes(q))
  }, [companies, search])

  const withoutAccess = companies.filter((c) => c.memberCount === 0).length
  const selected = companies.find((c) => c.id === selectedId) ?? null

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
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-2xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Configuração pendente</h2>
        <p className="mt-1.5 text-sm text-text-muted">O servidor ainda não tem as variáveis do Supabase configuradas (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-2xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Administração</h1>
        <p className="mt-1 text-sm text-text-muted">Empresas, contato, acessos e status de integração de cada cliente.</p>
      </div>

      {/* Barra de métricas — não é mais um card genérico, é a primeira coisa que responde "como tá a operação" */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border-subtle pb-4">
        <div>
          <p className="text-2xl font-bold tabular-nums text-text-primary">{companies.length}</p>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">{companies.length === 1 ? 'empresa' : 'empresas'}</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-text-primary">{companies.reduce((s, c) => s + c.memberCount, 0)}</p>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">acessos ativos</p>
        </div>
        <div>
          <p className={`text-2xl font-bold tabular-nums ${withoutAccess > 0 ? 'text-accent-amber' : 'text-text-primary'}`}>{withoutAccess}</p>
          <p className="text-[11px] uppercase tracking-wide text-text-muted">sem acesso vinculado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de empresas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="min-w-0 flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <form onSubmit={handleCreateCompany} className="flex gap-2">
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Nova empresa"
              className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingCompany || !newCompanyName.trim()}
              className="flex shrink-0 items-center justify-center rounded-lg bg-accent-blue/15 px-2.5 text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </form>
          {listFeedback && (
            <p className={`flex items-center gap-1.5 text-xs ${listFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {listFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {listFeedback.text}
            </p>
          )}

          <div className="flex flex-col gap-1">
            {filtered.length === 0 && (
              <p className="px-1 py-2 text-xs text-text-muted">{companies.length === 0 ? 'Nenhuma empresa cadastrada ainda.' : 'Nenhum resultado pra essa busca.'}</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  selectedId === c.id ? 'bg-accent-cyan/15' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                  style={{ background: `${hueFor(c.id)}22`, color: hueFor(c.id) }}
                >
                  {initialsFor(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${selectedId === c.id ? 'text-accent-cyan' : 'text-text-secondary'}`}>{c.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    {c.memberCount === 0 ? (
                      <span className="text-accent-amber">sem acesso</span>
                    ) : (
                      <>{c.memberCount} {c.memberCount === 1 ? 'acesso' : 'acessos'}</>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detalhe da empresa selecionada */}
        {selected ? (
          <CompanyDetail key={selected.id} company={selected} onChanged={loadCompanies} onDeleted={() => { setSelectedId(null); loadCompanies() }} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle p-6 text-center">
            <Building2 className="h-6 w-6 text-text-muted" />
            <p className="text-sm text-text-muted">Selecione uma empresa pra ver detalhes, ou crie uma nova.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CompanyDetail({ company, onChanged, onDeleted }: { company: Company; onChanged: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(company.name)
  const [contactEmail, setContactEmail] = useState(company.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(company.contactPhone ?? '')
  const [notes, setNotes] = useState(company.notes ?? '')
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

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    const res = await apiFetchJson<{ ok: boolean; members: Member[] }>(`/api/admin/members?companyId=${company.id}`)
    setMembers(res?.members ?? [])
    setLoadingMembers(false)
  }, [company.id])

  const loadIntegration = useCallback(async () => {
    setLoadingIntegration(true)
    const res = await apiFetchJson<IntegrationStatus & { ok: boolean }>(`/api/integrations/status?company_id=${company.id}`)
    setIntegration(res?.ok ? res : null)
    setLoadingIntegration(false)
  }, [company.id])

  useEffect(() => {
    loadMembers()
    loadIntegration()
  }, [loadMembers, loadIntegration])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, name, contactEmail, contactPhone, notes }),
      })
      if (res?.ok) {
        setSaveFeedback({ type: 'success', text: 'Salvo.' })
        onChanged()
      } else {
        setSaveFeedback({ type: 'error', text: res?.message ?? 'Erro ao salvar.' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; invited?: boolean }>('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), companyId: company.id }),
      })
      if (res?.ok) {
        setInviteFeedback({ type: 'success', text: res.invited ? `Convite enviado para ${inviteEmail.trim()}.` : 'Usuário já existia — vinculado.' })
        setInviteEmail('')
        await loadMembers()
        onChanged()
      } else {
        setInviteFeedback({ type: 'error', text: res?.message ?? 'Erro ao convidar.' })
      }
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    setRemovingUserId(userId)
    try {
      const res = await apiFetchJson<{ ok: boolean }>(`/api/admin/members?userId=${userId}&companyId=${company.id}`, { method: 'DELETE' })
      if (res?.ok) {
        await loadMembers()
        onChanged()
      }
    } finally {
      setRemovingUserId(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>(`/api/admin/companies?id=${company.id}`, { method: 'DELETE' })
      if (res?.ok) {
        onDeleted()
      } else {
        setDeleting(false)
        setConfirmingDelete(false)
      }
    } catch {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  const isConnected = integration?.status === 'connected'

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho da empresa — identidade visual (avatar + nome grande), não escondido dentro de um form */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: `${hueFor(company.id)}22`, color: hueFor(company.id) }}
        >
          {initialsFor(company.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-text-primary">{company.name}</h2>
          <p className="text-xs text-text-muted">Cliente desde {timeAgo(company.createdAt)}</p>
        </div>
        <span className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
          isConnected ? 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald' : 'border-border-subtle bg-bg-primary/40 text-text-muted'
        }`}>
          {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isConnected ? 'Integração ativa' : 'Sem integração'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Dados de contato */}
        <form onSubmit={handleSave} className="glass-panel flex flex-col gap-3 rounded-2xl p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Dados de contato</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary focus:border-accent-cyan/50 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted">E-mail de contato</label>
              <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contato@cliente.com" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-text-muted">Telefone</label>
              <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(11) 90000-0000" className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[11px] text-text-muted">Observações (plano, valor, data do contrato...)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none" />
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

        {/* Integração — tratamento visual próprio, não é mais uma grade de 3 números genérica */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Integração Mercado Livre</h3>
          {loadingIntegration ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          ) : integration ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{integration.productsCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">produtos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-text-primary">{integration.ordersCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">pedidos</p>
                </div>
              </div>
              {integration.lastSyncAt && <p className="text-[11px] text-text-muted">Última sync {timeAgo(integration.lastSyncAt)}</p>}
            </div>
          ) : (
            <p className="text-xs text-text-muted">Sem dados de integração ainda.</p>
          )}
        </div>
      </div>

      {/* Acessos — lista com avatar por pessoa, convite integrado na mesma seção (não mais um card separado igual) */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <Users2 className="h-3.5 w-3.5" />
            Acessos ({members.length})
          </h3>
        </div>

        {loadingMembers ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        ) : (
          <div className="flex flex-col gap-1 border-b border-border-subtle pb-3">
            {members.length === 0 && <p className="py-1.5 text-xs text-text-muted">Nenhum acesso vinculado ainda.</p>}
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: `${hueFor(m.userId)}22`, color: hueFor(m.userId) }}
                >
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
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
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

      {/* Excluir empresa */}
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
    </div>
  )
}
