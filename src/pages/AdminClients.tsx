import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, ShieldCheck, Settings, Loader2, CheckCircle2, XCircle, X, Search, AlertTriangle, Mail, Phone,
  MoreVertical, Eye, ShieldAlert, Users2, AlertCircle,
} from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import { hueFor, initialsFor, maskCnpj, type CnpjInfo } from '@/lib/adminUi'
import MarketplaceRow from '@/components/admin/MarketplaceRow'
import EmptyState from '@/components/admin/EmptyState'

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

const statusLabel: Record<string, { label: string; color: string; bg: string; border: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20' },
  ativo: { label: 'Ativo', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  em_risco: { label: 'Em risco', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  suspenso: { label: 'Suspenso', color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
}

// CNPJ mockado, determinístico por empresa — só usado quando a empresa
// ainda não tem CNPJ real cadastrado, pra não mostrar um traço vazio.
function mockCnpjDigits(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return String(h).padStart(14, '0').slice(0, 14)
}

// Aba "Clientes" — única tela com gestão de empresas (tabela, busca, criação).
// A Dashboard (Admin.tsx) não mostra mais nada disso.
export default function AdminClients() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
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

  async function handleCreateCompany(form: NewClientForm, cnpjInfo: CnpjInfo | null) {
    setCreatingCompany(true)
    setFeedback(null)
    try {
      const receitaData: CnpjInfo | null = cnpjInfo
        ? { ...cnpjInfo, razaoSocial: form.razaoSocial || cnpjInfo.razaoSocial, nomeFantasia: form.nomeFantasia || cnpjInfo.nomeFantasia }
        : (form.razaoSocial ? { razaoSocial: form.razaoSocial, nomeFantasia: form.nomeFantasia, situacaoCadastral: null, dataSituacaoCadastral: null, dataInicioAtividade: null, atividadePrincipal: null, cnaeCodigo: null, cnaesSecundarios: [], naturezaJuridica: null, porte: null, capitalSocial: null, telefone: null, email: null, endereco: null, matrizFilial: null, simplesNacional: null, socios: [] } : null)

      const res = await apiFetchJson<{ ok: boolean; message?: string; company?: { id: string } }>('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nomeFantasia,
          cnpj: form.cnpj || null,
          contactEmail: form.email || null,
          whatsapp: form.whatsapp || null,
          receitaData,
        }),
      })

      if (!res?.ok || !res.company) {
        setFeedback({ type: 'error', text: res?.message ?? 'Erro ao criar empresa.' })
        return
      }

      // Cliente criado — se tem e-mail, dispara o convite real (Supabase Auth
      // manda o link pra ele definir a própria senha; ninguém da equipe vê
      // ou cria senha de cliente). Falha no convite não desfaz a empresa —
      // dá pra convidar depois pela tela da empresa.
      if (form.email.trim()) {
        const inviteRes = await apiFetchJson<{ ok: boolean; message?: string }>('/api/admin/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.trim(), companyId: res.company.id }),
        })
        if (!inviteRes?.ok) {
          setFeedback({ type: 'error', text: `Cliente criado, mas o convite por e-mail falhou: ${inviteRes?.message ?? 'erro desconhecido'}. Convide de novo pela tela da empresa.` })
          setShowCreate(false)
          await loadCompanies()
          return
        }
        setFeedback({ type: 'success', text: `Cliente criado e convite enviado para ${form.email.trim()}.` })
      } else {
        setFeedback({ type: 'success', text: 'Cliente criado. Nenhum e-mail informado — convide um acesso depois pela tela da empresa.' })
      }

      setShowCreate(false)
      await loadCompanies()
    } finally {
      setCreatingCompany(false)
    }
  }

  async function handleToggleStatus(company: Company) {
    const nextStatus = company.status === 'suspenso' ? 'ativo' : 'suspenso'
    const res = await apiFetchJson<{ ok: boolean }>('/api/admin/companies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: company.id, name: company.name, status: nextStatus }),
    })
    if (res?.ok) await loadCompanies()
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
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan px-4 py-2.5 text-[13px] font-bold text-[#081423] shadow-lg shadow-accent-cyan/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Nova Empresa
        </button>
      </div>

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
        <EmptyState
          icon={Users2}
          title={companies.length === 0 ? 'Nenhum cliente ainda' : 'Nenhum resultado'}
          subtitle={companies.length === 0 ? 'Cadastre a primeira empresa pelo botão "Nova Empresa".' : 'Nenhuma empresa bate com essa busca.'}
        />
      ) : (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Integrações</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((c) => (
                <CompanyRow key={c.id} company={c} onToggleStatus={() => handleToggleStatus(c)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateClientModal
          submitting={creatingCompany}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateCompany}
        />
      )}
    </div>
  )
}

interface NewClientForm {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  email: string
  whatsapp: string
}

type CnpjLookupStatus = 'idle' | 'checking' | 'found' | 'notfound' | 'error'

function CreateClientModal({ onClose, onSubmit, submitting }: { onClose: () => void; onSubmit: (form: NewClientForm, cnpjInfo: CnpjInfo | null) => void; submitting: boolean }) {
  const [form, setForm] = useState<NewClientForm>({ razaoSocial: '', nomeFantasia: '', cnpj: '', email: '', whatsapp: '' })
  const [touchedRazao, setTouchedRazao] = useState(false)
  const [touchedFantasia, setTouchedFantasia] = useState(false)
  const [cnpjStatus, setCnpjStatus] = useState<CnpjLookupStatus>('idle')
  const [cnpjInfo, setCnpjInfo] = useState<CnpjInfo | null>(null)
  const [triedSubmit, setTriedSubmit] = useState(false)

  function set<K extends keyof NewClientForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Mesma lógica do formulário do site: consulta a Receita Federal (BrasilAPI)
  // assim que o CNPJ tem 14 dígitos, autopreenche Razão Social/Nome Fantasia
  // se o admin ainda não digitou nada, mas nunca bloqueia o cadastro por causa
  // disso — só avisa.
  useEffect(() => {
    const digits = form.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) {
      setCnpjStatus('idle')
      setCnpjInfo(null)
      return
    }
    let cancelled = false
    setCnpjStatus('checking')
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiFetchJson<{ ok: boolean; found: boolean | null } & Partial<CnpjInfo>>(`/api/cnpj-lookup?cnpj=${digits}`)
        if (cancelled) return
        if (res?.ok && res.found) {
          const info: CnpjInfo = {
            razaoSocial: res.razaoSocial ?? null,
            nomeFantasia: res.nomeFantasia ?? null,
            situacaoCadastral: res.situacaoCadastral ?? null,
            dataSituacaoCadastral: res.dataSituacaoCadastral ?? null,
            dataInicioAtividade: res.dataInicioAtividade ?? null,
            atividadePrincipal: res.atividadePrincipal ?? null,
            cnaeCodigo: res.cnaeCodigo ?? null,
            cnaesSecundarios: res.cnaesSecundarios ?? [],
            naturezaJuridica: res.naturezaJuridica ?? null,
            porte: res.porte ?? null,
            capitalSocial: res.capitalSocial ?? null,
            telefone: res.telefone ?? null,
            email: res.email ?? null,
            endereco: res.endereco ?? null,
            matrizFilial: res.matrizFilial ?? null,
            simplesNacional: res.simplesNacional ?? null,
            socios: res.socios ?? [],
          }
          setCnpjInfo(info)
          setCnpjStatus('found')
          setForm((f) => ({
            ...f,
            razaoSocial: !touchedRazao && info.razaoSocial ? info.razaoSocial : f.razaoSocial,
            nomeFantasia: !touchedFantasia && (info.nomeFantasia || info.razaoSocial) ? (info.nomeFantasia || info.razaoSocial || '') : f.nomeFantasia,
          }))
        } else if (res?.found === false) {
          setCnpjStatus('notfound')
          setCnpjInfo(null)
        } else {
          setCnpjStatus('error')
          setCnpjInfo(null)
        }
      } catch {
        if (!cancelled) { setCnpjStatus('error'); setCnpjInfo(null) }
      }
    }, 500)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [form.cnpj, touchedRazao, touchedFantasia])

  const cnpjDigitsValid = form.cnpj.replace(/\D/g, '').length === 0 || form.cnpj.replace(/\D/g, '').length === 14
  const canSubmit = form.nomeFantasia.trim().length > 0 && cnpjDigitsValid

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTriedSubmit(true)
    if (!canSubmit) return
    onSubmit(form, cnpjInfo)
  }

  const inputClass = (invalid?: boolean) =>
    `w-full rounded-lg border bg-bg-primary/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none ${
      invalid ? 'border-accent-rose/50' : 'border-border-subtle'
    }`
  const labelClass = 'mb-1.5 block text-[11px] font-medium text-text-muted'

  const nomeFantasiaInvalid = triedSubmit && !form.nomeFantasia.trim()
  const cnpjInvalid = triedSubmit && !cnpjDigitsValid

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-2xl rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-text-primary">Cadastrar Novo Cliente</h2>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-text-muted">Insira os dados do lojista para gerar o acesso imediato à plataforma.</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Razão Social</label>
            <input
              value={form.razaoSocial}
              onChange={(e) => { setTouchedRazao(true); set('razaoSocial', e.target.value) }}
              placeholder="Nome Fantasia Comercio Ltda"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass}>Nome Fantasia *</label>
            <input
              required
              autoFocus
              value={form.nomeFantasia}
              onChange={(e) => { setTouchedFantasia(true); set('nomeFantasia', e.target.value) }}
              placeholder="Nome Fantasia"
              className={inputClass(nomeFantasiaInvalid)}
            />
            {nomeFantasiaInvalid && <p className="mt-1 text-[11px] text-accent-rose">Nome Fantasia é obrigatório.</p>}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>CNPJ</label>
            <input
              value={form.cnpj}
              onChange={(e) => set('cnpj', maskCnpjInput(e.target.value))}
              placeholder="00.000.000/0001-00"
              maxLength={18}
              className={inputClass(cnpjInvalid)}
            />
            {cnpjInvalid && <p className="mt-1 text-[11px] text-accent-rose">CNPJ incompleto — precisa ter 14 dígitos, ou deixe vazio.</p>}
            {!cnpjInvalid && cnpjStatus === 'checking' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-text-muted"><Loader2 className="h-3 w-3 animate-spin" /> Consultando Receita Federal...</p>
            )}
            {!cnpjInvalid && cnpjStatus === 'found' && cnpjInfo && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-accent-emerald">
                <CheckCircle2 className="h-3 w-3" /> {cnpjInfo.razaoSocial} {cnpjInfo.situacaoCadastral ? `— ${cnpjInfo.situacaoCadastral}` : ''}
              </p>
            )}
            {!cnpjInvalid && cnpjStatus === 'notfound' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-accent-amber"><AlertCircle className="h-3 w-3" /> CNPJ não encontrado na Receita Federal. Confira o número — você ainda pode continuar.</p>
            )}
            {!cnpjInvalid && cnpjStatus === 'error' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-text-muted"><AlertCircle className="h-3 w-3" /> Não foi possível confirmar agora. Você pode continuar mesmo assim.</p>
            )}
          </div>
          <div>
            <label className={labelClass}>E-mail de Acesso</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contato@cliente.com" className={inputClass()} />
            <p className="mt-1 text-[11px] text-text-muted">Se preenchido, o cliente recebe um e-mail para criar a própria senha.</p>
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(11) 90000-0000" className={inputClass()} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border-subtle px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white/5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-accent-cyan px-5 py-2.5 text-[13.5px] font-bold text-[#081423] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Criar Cliente
          </button>
        </div>
      </form>
    </div>
  )
}

// Máscara simulada, aplicada enquanto o usuário digita — só formata, não valida dígito verificador.
function maskCnpjInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function CompanyRow({ company, onToggleStatus }: { company: Company; onToggleStatus: () => void }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<{ ok: boolean; status: string }>(`/api/integrations/status?company_id=${company.id}`).then((r) => {
      if (!cancelled) setConnected(r?.ok ? r.status === 'connected' : false)
    })
    return () => { cancelled = true }
  }, [company.id])

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const st = statusLabel[company.status] ?? statusLabel.ativo
  const cnpjDisplay = company.cnpj ? maskCnpj(company.cnpj) : maskCnpj(mockCnpjDigits(company.id))

  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3">
        <Link to={`/app/admin/empresa/${company.id}`} className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{ background: hueFor(company.id), color: '#081423' }}
          >
            {initialsFor(company.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-text-primary hover:underline">{company.name}</p>
            <p className={`truncate text-[11px] ${company.cnpj ? 'text-text-muted' : 'italic text-text-muted/70'}`}>{cnpjDisplay}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          <span className="flex items-center gap-2 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {company.contactEmail ?? '—'}
          </span>
          <span className="flex items-center gap-2 truncate">
            <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" /> {company.whatsapp ?? company.contactPhone ?? '—'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <MarketplaceRow active={connected ? ['mercadolivre'] : []} size="sm" />
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div ref={menuRef} className="relative inline-block">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
            aria-label="Ações"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-2xl">
              <Link
                to={`/app/admin/empresa/${company.id}`}
                className="flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <Eye className="h-3.5 w-3.5" /> Ver Detalhes
              </Link>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onToggleStatus() }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> {company.status === 'suspenso' ? 'Reativar Acesso' : 'Bloquear Acesso'}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
