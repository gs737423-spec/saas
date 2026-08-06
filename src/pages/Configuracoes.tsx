import { useEffect, useState } from 'react'
import { RotateCcw, SlidersHorizontal, Gauge, Boxes, Building2, KeyRound, Mail, Users2, Loader2, CheckCircle2, XCircle, UserX, UserPlus } from 'lucide-react'
import {
  useInventorySettings,
  DEFAULT_INVENTORY_SETTINGS,
  type GiroColors,
  type CoverageColors,
} from '@/contexts/InventorySettingsContext'
import type { TurnoverStatus } from '@/data/mockData'
import type { CoverageLabel } from '@/contexts/InventorySettingsContext'
import { supabase } from '@/lib/supabaseClient'
import { apiFetchJson } from '@/lib/apiFetch'
import { useAuth } from '@/contexts/AuthContext'
import CompanyRegistrationInfo from '@/components/common/CompanyRegistrationInfo'
import type { CnpjInfo } from '@/lib/adminUi'

const giroOrder: TurnoverStatus[] = ['Normal', 'Lento', 'Parado', 'Parado crítico']
const giroHint: Record<TurnoverStatus, string> = {
  'Normal': 'Giro saudável',
  'Lento': 'Giro abaixo do ideal',
  'Parado': 'Sem giro relevante',
  'Parado crítico': 'Capital parado há muito tempo',
}

const coverageOrder: CoverageLabel[] = ['Crítico', 'Atenção', 'Saudável', 'Excesso']
const coverageHint: Record<CoverageLabel, string> = {
  'Crítico': 'Risco de ruptura iminente',
  'Atenção': 'Cobertura ficando curta',
  'Saudável': 'Cobertura dentro do esperado',
  'Excesso': 'Capital parado em estoque acima do necessário',
}

function NumberField({ label, value, onChange, min, max, suffix = 'dias' }: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          step="1"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent-blue/50"
        />
        <span className="shrink-0 text-xs text-text-muted">{suffix}</span>
      </div>
    </div>
  )
}

function ColorSwatch({ label, hint, color, onChange }: { label: string; hint: string; color: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-transparent p-0.5"
      />
      <div className="min-w-0">
        <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color, background: `${color}1F` }}>
          {label}
        </span>
        <p className="mt-1 truncate text-[10px] text-text-muted">{hint}</p>
      </div>
    </div>
  )
}

function SectionShell({ icon: Icon, title, description, onReset, noReset, children }: {
  icon: typeof Gauge
  title: string
  description: string
  onReset: () => void
  noReset?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
            <Icon className="h-[18px] w-[18px] text-accent-blue" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-primary">{title}</h3>
            <p className="mt-0.5 text-xs text-text-muted">{description}</p>
          </div>
        </div>
        {!noReset && (
          <button
            onClick={onReset}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-border-default hover:text-text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrão
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

interface Company {
  id: string
  name: string
  cnpj: string | null
  receitaData: CnpjInfo | null
  contactEmail: string | null
  contactPhone: string | null
  whatsapp: string | null
}

interface TeamMember {
  userId: string
  email: string | null
  role: string
  addedAt: string
  isSelf: boolean
}

function MyCompanySection() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<{ ok: boolean; company: Company }>('/api/company').then((res) => {
      if (!cancelled) {
        setCompany(res?.company ?? null)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return (
    <SectionShell icon={Building2} title="Minha Empresa" description="Dados cadastrais e fiscais, capturados na Receita Federal no seu cadastro." onReset={() => {}} noReset>
      {loading ? (
        <div className="flex items-center gap-2 pt-4 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...</div>
      ) : company ? (
        <div className="border-t border-border-subtle pt-4">
          <CompanyRegistrationInfo
            name={company.name}
            cnpj={company.cnpj}
            receitaData={company.receitaData}
            contactEmail={company.contactEmail}
            contactPhone={company.contactPhone}
            whatsapp={company.whatsapp}
          />
        </div>
      ) : (
        <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">Não foi possível carregar os dados da empresa agora.</p>
      )}
    </SectionShell>
  )
}

function SecuritySection() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || email.trim() === user?.email) return
    setSavingEmail(true)
    setEmailFeedback(null)
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    setSavingEmail(false)
    if (error) {
      setEmailFeedback({ type: 'error', text: error.message })
    } else {
      setEmailFeedback({ type: 'success', text: 'Confirme a troca pelo link enviado nos dois e-mails (atual e novo).' })
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setPasswordFeedback({ type: 'error', text: 'A senha precisa ter pelo menos 8 caracteres.' })
      return
    }
    if (password !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }
    setSavingPassword(true)
    setPasswordFeedback(null)
    const { error } = await supabase.auth.updateUser({ password })
    setSavingPassword(false)
    if (error) {
      setPasswordFeedback({ type: 'error', text: error.message })
    } else {
      setPasswordFeedback({ type: 'success', text: 'Senha atualizada.' })
      setPassword('')
      setConfirmPassword('')
    }
  }

  const inputClass = 'w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue/50'

  return (
    <SectionShell icon={KeyRound} title="Segurança" description="Troque seu e-mail de acesso ou sua senha." onReset={() => {}} noReset>
      <div className="grid grid-cols-1 gap-4 border-t border-border-subtle pt-4 sm:grid-cols-2">
        <form onSubmit={handleChangeEmail} className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted"><Mail className="h-3.5 w-3.5" /> E-mail de acesso</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <button type="submit" disabled={savingEmail || !email.trim() || email.trim() === user?.email} className="flex w-fit items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-1.5 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:opacity-40">
            {savingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Salvar e-mail
          </button>
          {emailFeedback && (
            <p className={`flex items-center gap-1.5 text-xs ${emailFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {emailFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
              {emailFeedback.text}
            </p>
          )}
        </form>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted"><KeyRound className="h-3.5 w-3.5" /> Nova senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 8 caracteres" className={inputClass} />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="confirmar senha" className={inputClass} />
          <button type="submit" disabled={savingPassword || !password} className="flex w-fit items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-1.5 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/25 disabled:opacity-40">
            {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Salvar senha
          </button>
          {passwordFeedback && (
            <p className={`flex items-center gap-1.5 text-xs ${passwordFeedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {passwordFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
              {passwordFeedback.text}
            </p>
          )}
        </form>
      </div>
    </SectionShell>
  )
}

function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadMembers() {
    const res = await apiFetchJson<{ ok: boolean; members: TeamMember[] }>('/api/team')
    setMembers(res?.members ?? [])
    setLoading(false)
  }

  useEffect(() => { loadMembers() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setFeedback(null)
    const res = await apiFetchJson<{ ok: boolean; message?: string; invited?: boolean }>('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    })
    setInviting(false)
    if (res?.ok) {
      setFeedback({ type: 'success', text: res.invited ? `Convite enviado para ${inviteEmail.trim()}.` : 'Usuário já existia — vinculado à sua equipe.' })
      setInviteEmail('')
      await loadMembers()
    } else {
      setFeedback({ type: 'error', text: res?.message ?? 'Erro ao convidar.' })
    }
  }

  async function handleRemove(userId: string) {
    setRemovingUserId(userId)
    const res = await apiFetchJson<{ ok: boolean; message?: string }>(`/api/team?userId=${userId}`, { method: 'DELETE' })
    setRemovingUserId(null)
    if (res?.ok) await loadMembers()
    else setFeedback({ type: 'error', text: res?.message ?? 'Erro ao remover acesso.' })
  }

  return (
    <SectionShell icon={Users2} title="Equipe" description="Quem mais da sua empresa tem acesso à plataforma." onReset={() => {}} noReset>
      <div className="border-t border-border-subtle pt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...</div>
        ) : (
          <div className="flex flex-col gap-1 pb-3">
            {members.length === 0 && <p className="py-1.5 text-xs text-text-muted">Só você tem acesso por enquanto.</p>}
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5">
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{m.email ?? m.userId}{m.isSelf ? ' (você)' : ''}</span>
                {!m.isSelf && (
                  <button
                    onClick={() => handleRemove(m.userId)}
                    disabled={removingUserId === m.userId}
                    title="Remover acesso"
                    className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent-rose transition-colors hover:bg-accent-rose/10 disabled:opacity-40"
                  >
                    {removingUserId === m.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@suaempresa.com"
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted/45 focus:border-accent-cyan/50 focus:outline-none"
          />
          <button type="submit" disabled={inviting || !inviteEmail.trim()} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/25 disabled:opacity-40">
            {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Convidar
          </button>
        </form>
        {feedback && (
          <p className={`mt-2 flex items-center gap-1.5 text-xs ${feedback.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {feedback.text}
          </p>
        )}
      </div>
    </SectionShell>
  )
}

export default function Configuracoes() {
  const { settings, setSettings } = useInventorySettings()

  const updateGiroThreshold = (key: keyof typeof settings.giro.thresholds, value: number) => {
    setSettings({ ...settings, giro: { ...settings.giro, thresholds: { ...settings.giro.thresholds, [key]: value } } })
  }
  const updateGiroColor = (status: TurnoverStatus, value: string) => {
    setSettings({ ...settings, giro: { ...settings.giro, colors: { ...settings.giro.colors, [status]: value } as GiroColors } })
  }

  const updateCoverageThreshold = (key: keyof typeof settings.coverage.thresholds, value: number) => {
    setSettings({ ...settings, coverage: { ...settings.coverage, thresholds: { ...settings.coverage.thresholds, [key]: value } } })
  }
  const updateCoverageColor = (label: CoverageLabel, value: string) => {
    setSettings({ ...settings, coverage: { ...settings.coverage, colors: { ...settings.coverage.colors, [label]: value } as CoverageColors } })
  }

  const updateStockRule = (key: keyof typeof settings.stock, value: number) => {
    setSettings({ ...settings, stock: { ...settings.stock, [key]: value } })
  }

  const resetGiro = () => setSettings({ ...settings, giro: DEFAULT_INVENTORY_SETTINGS.giro })
  const resetCoverage = () => setSettings({ ...settings, coverage: DEFAULT_INVENTORY_SETTINGS.coverage })
  const resetStock = () => setSettings({ ...settings, stock: DEFAULT_INVENTORY_SETTINGS.stock })

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-text-primary">Minha Conta</h2>
        <p className="mt-0.5 text-sm text-text-muted">Dados da sua empresa, segurança de acesso, equipe e preferências da plataforma.</p>
      </div>

      <MyCompanySection />
      <SecuritySection />
      <TeamSection />

      {/* Giro — por dias de cobertura */}
      <SectionShell
        icon={SlidersHorizontal}
        title="Indicadores de Giro"
        description="Classificado pelos dias de cobertura do produto: menos dias = giro mais rápido. Defina as faixas e as cores."
        onReset={resetGiro}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField label="Normal até" value={settings.giro.thresholds.normalMaxDays} min={1} max={settings.giro.thresholds.lentoMaxDays} onChange={(v) => updateGiroThreshold('normalMaxDays', Math.min(v, settings.giro.thresholds.lentoMaxDays))} />
          <NumberField label="Lento até" value={settings.giro.thresholds.lentoMaxDays} min={settings.giro.thresholds.normalMaxDays} max={settings.giro.thresholds.paradoMaxDays} onChange={(v) => updateGiroThreshold('lentoMaxDays', Math.min(Math.max(v, settings.giro.thresholds.normalMaxDays), settings.giro.thresholds.paradoMaxDays))} />
          <NumberField label="Parado até" value={settings.giro.thresholds.paradoMaxDays} min={settings.giro.thresholds.lentoMaxDays} onChange={(v) => updateGiroThreshold('paradoMaxDays', Math.max(v, settings.giro.thresholds.lentoMaxDays))} />
        </div>
        <p className="mt-2 text-[10px] text-text-muted">Acima de {settings.giro.thresholds.paradoMaxDays} dias sem girar = "Parado crítico".</p>

        <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {giroOrder.map((status) => (
            <ColorSwatch key={status} label={status} hint={giroHint[status]} color={settings.giro.colors[status]} onChange={(v) => updateGiroColor(status, v)} />
          ))}
        </div>
      </SectionShell>

      {/* Cobertura — risco de ruptura x excesso */}
      <SectionShell
        icon={Gauge}
        title="Indicadores de Cobertura"
        description="Faixas de risco de ruptura e excesso de estoque, em dias de cobertura projetada."
        onReset={resetCoverage}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField label="Crítico até" value={settings.coverage.thresholds.criticoMaxDays} min={1} max={settings.coverage.thresholds.atencaoMaxDays} onChange={(v) => updateCoverageThreshold('criticoMaxDays', Math.min(v, settings.coverage.thresholds.atencaoMaxDays))} />
          <NumberField label="Atenção até" value={settings.coverage.thresholds.atencaoMaxDays} min={settings.coverage.thresholds.criticoMaxDays} max={settings.coverage.thresholds.saudavelMaxDays} onChange={(v) => updateCoverageThreshold('atencaoMaxDays', Math.min(Math.max(v, settings.coverage.thresholds.criticoMaxDays), settings.coverage.thresholds.saudavelMaxDays))} />
          <NumberField label="Saudável até" value={settings.coverage.thresholds.saudavelMaxDays} min={settings.coverage.thresholds.atencaoMaxDays} onChange={(v) => updateCoverageThreshold('saudavelMaxDays', Math.max(v, settings.coverage.thresholds.atencaoMaxDays))} />
        </div>
        <p className="mt-2 text-[10px] text-text-muted">Acima de {settings.coverage.thresholds.saudavelMaxDays} dias = "Excesso".</p>

        <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {coverageOrder.map((label) => (
            <ColorSwatch key={label} label={label} hint={coverageHint[label]} color={settings.coverage.colors[label]} onChange={(v) => updateCoverageColor(label, v)} />
          ))}
        </div>
      </SectionShell>

      {/* Regras de KPI do Estoque */}
      <SectionShell
        icon={Boxes}
        title="Regras dos Cards de Estoque"
        description="Limiares usados nos cards de resumo da página Estoque."
        onReset={resetStock}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField
            label="Estoque crítico quando cobertura ≤"
            value={settings.stock.criticalStockDays}
            min={1}
            onChange={(v) => updateStockRule('criticalStockDays', Math.max(1, v))}
          />
          <NumberField
            label="Excesso de estoque quando cobertura >"
            value={settings.stock.excessStockDays}
            min={1}
            onChange={(v) => updateStockRule('excessStockDays', Math.max(1, v))}
          />
          <NumberField
            label='"Sem entrada recente" após'
            value={settings.stock.noRecentEntryDays}
            min={1}
            onChange={(v) => updateStockRule('noRecentEntryDays', Math.max(1, v))}
          />
        </div>
      </SectionShell>

      <p className="text-[11px] text-text-muted">Tudo aqui é salvo automaticamente neste navegador e aplicado em toda a página Estoque.</p>
    </div>
  )
}
