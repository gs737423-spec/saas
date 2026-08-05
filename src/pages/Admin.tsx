import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, ShieldCheck, Loader2, Building, UserPlus, Users2, AlertTriangle, KeyRound, Link2Off, ArrowUpRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import { LogoMercadoLivre, LogoShopee, LogoAmazon } from '@/site/logos'

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

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Bloco 1 — Crescimento (dado real) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard icon={Building} color="cyan" value={companies.length} label={companies.length === 1 ? 'cliente' : 'clientes'} />
        <KpiCard icon={UserPlus} color="emerald" value={newThisMonth} label="novos clientes (mês)" />
        <KpiCard icon={Users2} color="violet" value={activeAccess} label="acessos ativos" />
      </div>

      {/* Bloco 2 — Saúde das integrações */}
      <div className="glass-panel rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Saúde das Integrações</h3>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[9px] font-semibold uppercase text-text-muted" title="Ainda não existe telemetria real de API no banco">exemplo</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <IntegrationHealth Logo={LogoMercadoLivre} name="Mercado Livre" status="online" />
          <IntegrationHealth Logo={LogoShopee} name="Shopee" status="online" />
          <IntegrationHealth Logo={LogoAmazon} name="Amazon" status="instavel" />
        </div>
      </div>

      {/* Bloco 3 — Alertas operacionais */}
      <div className="glass-panel rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Alertas Operacionais</h3>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[9px] font-semibold uppercase text-text-muted" title="Combina 1 alerta real com exemplos de alertas que ainda não existem no banco">real + exemplo</span>
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {withoutAccess > 0 && (
            <Link to="/app/admin/clientes" className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-white/5">
              <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                <Link2Off className="h-4 w-4 shrink-0 text-accent-amber" />
                {withoutAccess} {withoutAccess === 1 ? 'cliente sem' : 'clientes sem'} acesso vinculado
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent-cyan">Ver <ArrowUpRight className="h-3 w-3" /></span>
            </Link>
          )}
          <div className="flex items-center justify-between gap-3 py-2.5 opacity-60">
            <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
              <KeyRound className="h-4 w-4 shrink-0 text-accent-rose" />
              3 clientes com tokens expirados
            </span>
            <span className="rounded-full border border-border-subtle px-1.5 py-0.5 text-[9px] font-semibold uppercase text-text-muted">exemplo</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5 opacity-60">
            <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
              <AlertTriangle className="h-4 w-4 shrink-0 text-accent-amber" />
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
} as const

function KpiCard({ icon: Icon, color, value, label }: { icon: typeof Building; color: keyof typeof colorMap; value: number; label: string }) {
  return (
    <div className="glass-panel flex flex-col items-start gap-2 rounded-xl p-4">
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
    <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-primary/30 p-3">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full [&>svg]:h-8 [&>svg]:w-8"><Logo /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">{name}</p>
        <span className={`flex items-center gap-1.5 text-[11px] font-medium ${st.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
        </span>
      </div>
    </div>
  )
}
