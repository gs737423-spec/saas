import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, ShieldCheck, Settings, Loader2, CheckCircle2, XCircle, Search, ArrowUpRight, AlertTriangle, Activity, Users2, Building } from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import { hueFor, initialsFor, timeAgo } from '@/lib/adminUi'
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

interface ActivityEntry {
  id: string
  companyId: string | null
  companyName: string | null
  provider: string
  eventType: string
  status: 'info' | 'success' | 'error'
  message: string | null
  createdAt: string
}

type Feedback = { type: 'success' | 'error'; text: string } | null

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ativo: { label: 'Ativa', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
  em_risco: { label: 'Em risco', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  suspenso: { label: 'Suspensa', color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
}

export default function Admin() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

  const [search, setSearch] = useState('')
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

  const loadActivity = useCallback(async () => {
    const res = await apiFetchJson<{ ok: boolean; activity: ActivityEntry[] }>('/api/admin/activity?limit=10')
    setActivity(res?.activity ?? [])
  }, [])

  useEffect(() => {
    loadCompanies()
    loadActivity()
  }, [loadCompanies, loadActivity])

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
      <div className="glass-panel admin-card mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Configuração pendente</h2>
        <p className="mt-1.5 text-sm text-text-muted">O servidor ainda não tem as variáveis do Supabase configuradas (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel admin-card mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <form onSubmit={handleCreateCompany} className="flex gap-2">
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="Nome da nova empresa"
              className="w-52 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingCompany || !newCompanyName.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Empresa
            </button>
          </form>
        </div>

        {feedback && (
          <p className={`flex items-center gap-1.5 text-xs ${feedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {feedback.text}
          </p>
        )}

        {/* Métricas — só dado real, nada calculado/fabricado */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="glass-panel flex flex-col items-start gap-2 rounded-xl p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan"><Building className="h-4 w-4" /></span>
            <p className="text-2xl font-bold tabular-nums text-text-primary">{companies.length}</p>
            <p className="text-[11px] text-text-muted">{companies.length === 1 ? 'empresa' : 'empresas'}</p>
          </div>
          <div className="glass-panel flex flex-col items-start gap-2 rounded-xl p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/10 text-accent-violet"><Users2 className="h-4 w-4" /></span>
            <p className="text-2xl font-bold tabular-nums text-text-primary">{companies.reduce((s, c) => s + c.memberCount, 0)}</p>
            <p className="text-[11px] text-text-muted">acessos ativos</p>
          </div>
          <div className="glass-panel flex flex-col items-start gap-2 rounded-xl p-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${withoutAccess.length > 0 ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-emerald/10 text-accent-emerald'}`}><AlertTriangle className="h-4 w-4" /></span>
            <p className={`text-2xl font-bold tabular-nums ${withoutAccess.length > 0 ? 'text-accent-amber' : 'text-text-primary'}`}>{withoutAccess.length}</p>
            <p className="text-[11px] text-text-muted">sem acesso vinculado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Empresas que precisam de atenção — calculado de verdade (sem acesso), não é lista mockada */}
          {withoutAccess.length > 0 && (
            <div className="glass-panel rounded-xl p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-amber">
                <AlertTriangle className="h-3.5 w-3.5" />
                Precisam de atenção
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

          {/* Atividade recente — dado real de sync_logs, não mockado */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              <Activity className="h-3.5 w-3.5" />
              Atividade recente
            </h3>
            {activity.length === 0 ? (
              <p className="px-2 py-2 text-xs text-text-muted">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      a.status === 'success' ? 'bg-accent-emerald' : a.status === 'error' ? 'bg-accent-rose' : 'bg-accent-cyan'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-text-secondary">
                        {a.companyName && <span className="font-medium text-text-primary">{a.companyName}</span>} {a.message ?? a.eventType}
                      </p>
                      <p className="text-[10px] text-text-muted">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
