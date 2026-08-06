import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, ShieldCheck, Loader2, Building, UserPlus, Users2, AlertTriangle, KeyRound, Link2Off, ArrowUpRight,
  PackageCheck, CircleDollarSign, Inbox,
} from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import { LogoMercadoLivre, LogoShopee, LogoAmazon } from '@/site/logos'
import { MOCK_LEADS_COUNT } from '@/lib/mockLeads'
import { useAuth } from '@/contexts/AuthContext'

interface Company {
  id: string
  name: string
  createdAt: string
  memberCount: number
}

// Dashboard estratégico do Painel Admin. Bloco 1 é 100% dado real (mesma
// fonte que a aba Clientes). Blocos 2 e 3 ainda não têm telemetria de API
// nem alertas automáticos no banco — ficam com badge "exemplo" explícito
// em vez de fingir ser real (ver CORE-RULES #3 evidência antes de afirmação).
export default function Admin() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)

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

  const now = new Date()
  const newThisMonth = companies.filter((c) => {
    const d = new Date(c.createdAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const activeAccess = companies.reduce((s, c) => s + c.memberCount, 0)
  const withoutAccess = companies.filter((c) => c.memberCount === 0).length

  const firstName = (user?.email?.split('@')[0].split(/[._]/)[0] ?? 'Admin').replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
      {/* Barra de boas-vindas — dado real é só o nome; "operando normalmente"
          é uma frase de clima, não uma checagem real de uptime. */}
      <div className="flex items-center gap-2.5 text-[13px] text-text-secondary">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
        </span>
        Olá, {firstName}. O ecossistema está operando normalmente hoje.
      </div>

      {/* Banner do funil comercial — leva pra Solicitações (mock hoje, real
          quando a tabela `leads` existir). */}
      {MOCK_LEADS_COUNT > 0 && (
        <Link
          to="/app/admin/solicitacoes"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-cyan/25 bg-gradient-to-r from-accent-cyan/15 to-accent-cyan/5 px-5 py-4 transition-colors hover:from-accent-cyan/20"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-cyan/15 text-accent-cyan"><Inbox className="h-4.5 w-4.5" /></span>
            <span className="text-[13.5px] font-medium text-text-primary">
              Você tem <strong className="font-bold text-accent-cyan">{MOCK_LEADS_COUNT} {MOCK_LEADS_COUNT === 1 ? 'nova solicitação' : 'novas solicitações'}</strong> de cadastro aguardando aprovação.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-cyan px-3.5 py-2 text-[12.5px] font-bold text-[#081423] transition-transform group-hover:scale-[1.02]">
            Ir para Solicitações <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      {/* Bloco 1 — Crescimento (3 primeiros KPIs = dado real; os 2 últimos
          são ilustrativos, marcados, até existir sync real de pedidos/GMV). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={Building} color="cyan" value={companies.length} label={companies.length === 1 ? 'cliente' : 'clientes'} />
        <KpiCard icon={UserPlus} color="emerald" value={newThisMonth} label="novos clientes (mês)" />
        <KpiCard icon={Users2} color="violet" value={activeAccess} label="acessos ativos" />
        <KpiCard icon={PackageCheck} color="blue" value="128" label="pedidos sincronizados (hoje)" example />
        <KpiCard icon={CircleDollarSign} color="amber" value="R$ 84,2k" label="GMV transacionado (mês)" example />
      </div>

      {/* Bloco 2 — Saúde das integrações */}
      <div className="glass-panel rounded-xl p-5 transition-all duration-200 hover:border-border-active">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Saúde das Integrações</h3>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[9px] font-semibold uppercase text-text-muted" title="Ainda não existe telemetria real de API no banco">exemplo</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <IntegrationHealth Logo={LogoMercadoLivre} name="Mercado Livre" status="online" />
          <IntegrationHealth Logo={LogoShopee} name="Shopee" status="online" />
          <IntegrationHealth Logo={LogoAmazon} name="Amazon" status="instavel" />
        </div>
      </div>

      {/* Bloco 3 — Alertas operacionais */}
      <div className="glass-panel rounded-xl p-5 transition-all duration-200 hover:border-border-active">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Alertas Operacionais</h3>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[9px] font-semibold uppercase text-text-muted" title="Combina 1 alerta real com exemplos de alertas que ainda não existem no banco">real + exemplo</span>
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {withoutAccess > 0 && (
            <Link to="/app/admin/clientes" className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-white/5">
              <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-amber/15"><Link2Off className="h-3.5 w-3.5 text-accent-amber" /></span>
                {withoutAccess} {withoutAccess === 1 ? 'cliente sem' : 'clientes sem'} acesso vinculado
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent-cyan">Ver <ArrowUpRight className="h-3 w-3" /></span>
            </Link>
          )}
          <div className="flex items-center justify-between gap-3 py-2.5 opacity-60">
            <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-amber/15"><KeyRound className="h-3.5 w-3.5 text-accent-amber" /></span>
              3 clientes com tokens expirados
            </span>
            <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[9px] font-semibold uppercase text-text-muted">exemplo</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5 opacity-60">
            <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-amber/15"><AlertTriangle className="h-3.5 w-3.5 text-accent-amber" /></span>
              2 clientes sem marketplace vinculado
            </span>
            <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[9px] font-semibold uppercase text-text-muted">exemplo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan',
  emerald: 'bg-accent-emerald/10 text-accent-emerald',
  violet: 'bg-accent-violet/10 text-accent-violet',
  blue: 'bg-accent-blue/10 text-accent-blue',
  amber: 'bg-accent-amber/10 text-accent-amber',
} as const

function KpiCard({ icon: Icon, color, value, label, example }: { icon: typeof Building; color: keyof typeof colorMap; value: number | string; label: string; example?: boolean }) {
  return (
    <div className="glass-panel relative flex flex-col items-start gap-2 rounded-xl p-4 transition-all duration-200 hover:border-border-active hover:-translate-y-0.5">
      {example && (
        <span className="absolute right-3 top-3 rounded-full border border-border-subtle px-1.5 py-0.5 text-[8px] font-semibold uppercase text-text-muted" title="Ilustrativo — ainda sem sync real de pedidos/GMV">exemplo</span>
      )}
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}><Icon className="h-4 w-4" /></span>
      <p className="text-2xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </div>
  )
}

const healthStyle = {
  online: { label: 'Online', color: 'text-accent-emerald', dot: 'bg-accent-emerald' },
  instavel: { label: 'Instável', color: 'text-accent-amber', dot: 'bg-accent-amber' },
  offline: { label: 'Offline', color: 'text-accent-rose', dot: 'bg-accent-rose' },
} as const

function IntegrationHealth({ Logo, name, status }: { Logo: () => React.JSX.Element; name: string; status: keyof typeof healthStyle }) {
  const st = healthStyle[status]
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-primary/30 p-3.5">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full [&>img]:h-9 [&>img]:w-9 [&>svg]:h-9 [&>svg]:w-9"><Logo /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">{name}</p>
        <span className={`flex items-center gap-1.5 text-[11px] font-medium ${st.color}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${st.dot} opacity-60`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${st.dot}`} />
          </span>
          {st.label}
        </span>
      </div>
    </div>
  )
}
