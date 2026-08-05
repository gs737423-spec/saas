import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, ShieldCheck, Settings, Loader2, CheckCircle2, XCircle, Search, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import { hueFor, initialsFor } from '@/lib/adminUi'
import { LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLojaPropria } from '@/site/logos'

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

type Feedback = { type: 'success' | 'error'; text: string } | null

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ativo: { label: 'Ativa', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
  em_risco: { label: 'Em risco', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  suspenso: { label: 'Suspensa', color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
}

// Aba "Clientes" — única tela com gestão de empresas (lista, busca, criação).
// A Dashboard (Admin.tsx) não mostra mais nada disso.
export default function AdminClients() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creatingCompany, setCreatingCompany] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

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

  useEffect(() => { loadCompanies() }, [loadCompanies])

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!newCompanyName.trim()) return
    setCreatingCompany(true)
    setFeedback(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      })
      if (res?.ok) {
        setNewCompanyName('')
        setShowCreate(false)
        await loadCompanies()
      } else {
        setFeedback({ type: 'error', text: res?.message ?? 'Erro ao criar empresa.' })
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

  const withoutAccess = companies.filter((c) => c.memberCount === 0)

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
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Configuração pendente</h2>
        <p className="mt-1.5 text-sm text-text-muted">O servidor ainda não tem as variáveis do Supabase configuradas (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Clientes</h1>
          <p className="mt-1 text-sm text-text-muted">{companies.length} {companies.length === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan px-4 py-2.5 text-[13px] font-bold text-[#081423] shadow-lg shadow-accent-cyan/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Nova Empresa
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateCompany} className="glass-panel flex flex-wrap items-center gap-2 rounded-xl p-4">
          <input
            autoFocus
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Nome da nova empresa"
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creatingCompany || !newCompanyName.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creatingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Criar
          </button>
        </form>
      )}

      {feedback && (
        <p className={`flex items-center gap-1.5 text-xs ${feedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {feedback.text}
        </p>
      )}

      {withoutAccess.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-amber">
            <AlertTriangle className="h-3.5 w-3.5" />
            Precisam de atenção — sem acesso vinculado
          </h3>
          <div className="flex flex-col gap-1">
            {withoutAccess.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/app/admin/empresa/${c.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/5">
                <span className="truncate text-text-primary">{c.name}</span>
                <span className="shrink-0 text-[11px] text-accent-amber">sem acesso vinculado</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 sm:max-w-xs">
        <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empresa..."
          className="min-w-0 flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted/45 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle p-6 text-center">
          <Building2 className="h-6 w-6 text-text-muted" />
          <p className="text-sm text-text-muted">{companies.length === 0 ? 'Nenhuma empresa cadastrada ainda.' : 'Nenhum resultado pra essa busca.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company }: { company: Company }) {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<{ ok: boolean; status: string }>(`/api/integrations/status?company_id=${company.id}`).then((r) => {
      if (!cancelled) setConnected(r?.ok ? r.status === 'connected' : false)
    })
    return () => { cancelled = true }
  }, [company.id])

  const st = statusLabel[company.status] ?? statusLabel.ativo

  return (
    <Link
      to={`/app/admin/empresa/${company.id}`}
      className="group glass-panel glass-panel-hover flex flex-col gap-3 rounded-xl p-4 transition-transform"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
          style={{ background: hueFor(company.id), color: '#081423' }}
        >
          {initialsFor(company.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">{company.name}</p>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${st.color} ${st.bg}`}>{st.label}</span>
          </div>
          <p className="truncate text-[11px] text-text-muted">{company.contactEmail ?? 'sem contato cadastrado'}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex items-center gap-1.5 border-t border-border-subtle pt-3">
        <div className={connected ? '' : 'opacity-35 grayscale'}><LogoMercadoLivre /></div>
        <div className="opacity-35 grayscale"><LogoShopee /></div>
        <div className="opacity-35 grayscale"><LogoAmazon /></div>
        <div className="opacity-35 grayscale"><LogoLojaPropria /></div>
        <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-text-muted">
          {company.memberCount === 0 ? (
            <span className="text-accent-amber">sem acesso</span>
          ) : (
            `${company.memberCount} ${company.memberCount === 1 ? 'acesso' : 'acessos'}`
          )}
        </span>
      </div>
    </Link>
  )
}
