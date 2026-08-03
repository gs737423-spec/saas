import { useCallback, useEffect, useState } from 'react'
import { Building2, Mail, Phone, Plus, ShieldCheck, Settings, Loader2, CheckCircle2, XCircle, Trash2, UserX, Save, Wifi, WifiOff } from 'lucide-react'
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

export default function Admin() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

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
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Administração</h1>
        <p className="mt-1 text-sm text-text-muted">Empresas, contato, acessos e status de integração de cada cliente.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de empresas */}
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
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

          <div className="flex flex-col gap-1.5">
            {companies.length === 0 && <p className="px-1 py-2 text-xs text-text-muted">Nenhuma empresa cadastrada ainda.</p>}
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedId === c.id ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-[10px] text-text-muted">{c.memberCount} {c.memberCount === 1 ? 'membro' : 'membros'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detalhe da empresa selecionada */}
        {selected ? (
          <CompanyDetail key={selected.id} company={selected} onChanged={loadCompanies} onDeleted={() => { setSelectedId(null); loadCompanies() }} />
        ) : (
          <div className="glass-panel flex min-h-[200px] items-center justify-center rounded-2xl p-6 text-sm text-text-muted">
            Selecione uma empresa pra ver detalhes, ou crie uma nova.
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

  return (
    <div className="flex flex-col gap-4">
      {/* Dados da empresa */}
      <form onSubmit={handleSave} className="glass-panel flex flex-col gap-3 rounded-2xl p-5">
        <div className="mb-1 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-sm font-semibold text-text-primary">Dados da empresa</h2>
        </div>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Status de integração */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            {integration?.status === 'connected' ? <Wifi className="h-4 w-4 text-accent-emerald" /> : <WifiOff className="h-4 w-4 text-text-muted" />}
            <h2 className="text-sm font-semibold text-text-primary">Integração (Mercado Livre)</h2>
          </div>
          {loadingIntegration ? (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          ) : integration ? (
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-lg font-bold text-text-primary">{integration.productsCount}</p>
                <p className="text-text-muted">produtos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{integration.ordersCount}</p>
                <p className="text-text-muted">pedidos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary capitalize">{integration.status}</p>
                <p className="text-text-muted">status</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Sem dados de integração ainda.</p>
          )}
        </div>

        {/* Convidar novo acesso */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-text-primary">Criar acesso</h2>
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@cliente.com"
              className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
            />
            <button type="submit" disabled={inviting || !inviteEmail.trim()} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/25 disabled:opacity-40">
              {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Convidar'}
            </button>
          </form>
          {inviteFeedback && (
            <p className={`mt-2 flex items-center gap-1.5 text-xs ${inviteFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {inviteFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {inviteFeedback.text}
            </p>
          )}
        </div>
      </div>

      {/* Membros com acesso */}
      <div className="glass-panel rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Acessos ({members.length})</h2>
        {loadingMembers ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        ) : members.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum acesso vinculado ainda.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
                <span className="truncate text-text-primary">{m.email ?? m.userId}</span>
                <button
                  onClick={() => handleRemoveMember(m.userId)}
                  disabled={removingUserId === m.userId}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10 disabled:opacity-40"
                >
                  {removingUserId === m.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excluir empresa */}
      <div className="glass-panel rounded-2xl border-accent-rose/20 p-5">
        <h2 className="mb-2 text-sm font-semibold text-accent-rose">Zona de risco</h2>
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
