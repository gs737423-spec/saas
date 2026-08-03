import { useCallback, useEffect, useState } from 'react'
import { Building2, Mail, Plus, ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { apiFetchJson } from '@/lib/apiFetch'

interface Company {
  id: string
  name: string
  createdAt: string
  memberCount: number
}

type Feedback = { type: 'success' | 'error'; text: string } | null

export default function Admin() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [companyFeedback, setCompanyFeedback] = useState<Feedback>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteCompanyId, setInviteCompanyId] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState<Feedback>(null)

  const loadCompanies = useCallback(async () => {
    const result = await apiFetchJson<{ ok: boolean; companies: Company[] }>('/api/admin/companies')
    if (result?.ok) {
      setCompanies(result.companies)
      setUnauthorized(false)
      if (!inviteCompanyId && result.companies.length > 0) setInviteCompanyId(result.companies[0].id)
    } else {
      setUnauthorized(true)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) return
    setCreatingCompany(true)
    setCompanyFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName.trim() }),
      })
      if (res?.ok) {
        setCompanyFeedback({ type: 'success', text: `Empresa "${companyName.trim()}" criada.` })
        setCompanyName('')
        await loadCompanies()
      } else {
        setCompanyFeedback({ type: 'error', text: res?.message ?? 'Erro ao criar empresa.' })
      }
    } finally {
      setCreatingCompany(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteCompanyId) return
    setInviting(true)
    setInviteFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string; invited?: boolean }>('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), companyId: inviteCompanyId }),
      })
      if (res?.ok) {
        setInviteFeedback({
          type: 'success',
          text: res.invited
            ? `Convite enviado para ${inviteEmail.trim()}.`
            : `Usuário já existia — vinculado à empresa.`,
        })
        setInviteEmail('')
        await loadCompanies()
      } else {
        setInviteFeedback({ type: 'error', text: res?.message ?? 'Erro ao convidar usuário.' })
      }
    } finally {
      setInviting(false)
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
        <p className="mt-1 text-sm text-text-muted">Criar empresas e convidar clientes — cada um só enxerga a própria empresa.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-text-primary">Nova empresa</h2>
          </div>
          <form onSubmit={handleCreateCompany} className="flex flex-col gap-3">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
              className="rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingCompany || !companyName.trim()}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Criar empresa
            </button>
            {companyFeedback && (
              <p className={`flex items-center gap-1.5 text-xs ${companyFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {companyFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {companyFeedback.text}
              </p>
            )}
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-text-primary">Convidar cliente</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <select
              value={inviteCompanyId}
              onChange={(e) => setInviteCompanyId(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary focus:border-accent-cyan/50 focus:outline-none"
            >
              <option value="" disabled>Escolha a empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@cliente.com"
              className="rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim() || !inviteCompanyId}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 py-2 text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Enviar convite
            </button>
            {inviteFeedback && (
              <p className={`flex items-center gap-1.5 text-xs ${inviteFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {inviteFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {inviteFeedback.text}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Empresas ({companies.length})</h2>
        {companies.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2.5 text-sm">
                <span className="font-medium text-text-primary">{c.name}</span>
                <span className="text-xs text-text-muted">{c.memberCount} {c.memberCount === 1 ? 'membro' : 'membros'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
