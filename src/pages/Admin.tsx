import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Settings, ShieldCheck, Loader2, Building, UserPlus, AlertTriangle, Link2Off, ArrowUpRight,
  PackageCheck, CircleDollarSign, Inbox,
} from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import { useLeadsCount } from '@/lib/useLeadsCount'
import { usePeriod } from '@/contexts/PeriodContext'

interface Company {
  id: string
  name: string
  createdAt: string
  memberCount: number
  status: string
}

// Dashboard estratégico do Painel Admin. Os indicadores numéricos usam dados
// reais. Recursos ainda sem telemetria são declarados como indisponíveis e
// nunca recebem valores simulados.
export default function Admin() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)
  const [stats, setStats] = useState<{ ordersCount: number; totalGmv: number } | null>(null)
  const leadsCount = useLeadsCount()
  const { period } = usePeriod()

  // 403 (not_admin) é o único caso que deve mostrar "Acesso restrito" — erro
  // de rede/cold start logo após o login não pode virar essa mensagem
  // (assustava admin de verdade dizendo que ele não tinha permissão). 1
  // retry automático absorve a maioria dos casos transitórios; se persistir,
  // mostra erro genérico com botão de tentar de novo, nunca "sem permissão".
  const loadCompanies = useCallback(async (isRetry = false) => {
    try {
      const res = await apiFetch('/api/admin/companies')
      if (res.status === 403) {
        setUnauthorized(true)
        setLoadError(false)
        setConfigMissing(false)
        setLoading(false)
        return
      }
      if (res.status === 503) {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null
        if (body?.error === 'config_missing') {
          setConfigMissing(true)
        } else {
          setLoadError(true)
        }
        setLoading(false)
        return
      }
      const body = (await res.json().catch(() => null)) as { ok: boolean; companies?: Company[] } | null
      if (res.ok && body?.ok) {
        setCompanies(body.companies ?? [])
        setUnauthorized(false)
        setLoadError(false)
        setConfigMissing(false)
        setLoading(false)
        return
      }
      throw new Error('unexpected_response')
    } catch {
      if (!isRetry) {
        await new Promise((r) => setTimeout(r, 800))
        return loadCompanies(true)
      }
      setLoadError(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  useEffect(() => {
    let cancelled = false
    apiFetchJson<{ ok: boolean; ordersCount: number; totalGmv: number }>('/api/admin/stats').then((res) => {
      if (!cancelled && res?.ok) setStats({ ordersCount: res.ordersCount, totalGmv: res.totalGmv })
    })
    return () => { cancelled = true }
  }, [])

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
        <p className="mt-1.5 text-sm text-text-muted">A configuração de dados administrativos ainda não está disponível.</p>
        <p className="mt-2 text-xs text-text-muted">Procure o responsável pela implantação para concluir esta etapa.</p>
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

  if (loadError) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Não foi possível carregar</h2>
        <p className="mt-1.5 text-sm text-text-muted">Falha de conexão ao verificar seu acesso. Tente novamente.</p>
        <button
          type="button"
          onClick={() => { setLoading(true); setLoadError(false); loadCompanies() }}
          className="mt-3 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const since = new Date(Date.now() - period.days * 24 * 60 * 60 * 1000)
  const newInPeriod = companies.filter((c) => new Date(c.createdAt) >= since).length
  const activeClients = companies.filter((c) => c.status === 'ativo').length
  const withoutAccess = companies.filter((c) => c.memberCount === 0).length
  const gmvLabel = stats ? `R$ ${stats.totalGmv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6">
      {/* Banner do funil comercial — leva pra Solicitações, contagem real
          da tabela `leads` (ver migration 013). */}
      {leadsCount > 0 && (
        <Link
          to="/app/admin/solicitacoes"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-primary/25 bg-gradient-to-r from-accent-primary/15 to-accent-primary/5 px-5 py-4 transition-colors hover:from-accent-primary/20"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary"><Inbox className="h-4.5 w-4.5" /></span>
            <span className="text-[13.5px] font-medium text-text-primary">
              Você tem <strong className="font-bold text-accent-primary">{leadsCount} {leadsCount === 1 ? 'nova solicitação' : 'novas solicitações'}</strong> de cadastro aguardando aprovação.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-primary px-3.5 py-2 text-[12.5px] font-bold text-[#081423] transition-transform group-hover:scale-[1.02]">
            Ir para Solicitações <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      {/* Bloco 1 — Crescimento. Clientes Ativos/Novos Cadastros = dado real
          por período; Pedidos/GMV = total acumulado real de todos os
          clientes (api/admin/stats.ts), nunca por período. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={Building} color="cyan" value={activeClients} label="Clientes Ativos" onClick={() => navigate('/app/admin/clientes')} />
        <KpiCard icon={UserPlus} color="emerald" value={newInPeriod} label="Novos Cadastros" onClick={() => navigate('/app/admin/solicitacoes')} />
        <KpiCard icon={PackageCheck} color="blue" value={stats ? stats.ordersCount : '—'} label="Pedidos (todos os clientes)" />
        <KpiCard icon={CircleDollarSign} color="amber" value={gmvLabel} label="GMV total (todos os clientes)" />
      </div>

      {/* Sem telemetria consolidada, o painel explicita a ausência em vez de simular status. */}
      <div className="glass-panel rounded-xl p-5 transition-all duration-200 hover:border-border-active">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Saúde das Integrações</h3>
        <p className="mt-2 text-sm text-text-secondary">A telemetria consolidada das integrações ainda não está disponível.</p>
      </div>

      {/* Bloco 3 — Alertas operacionais */}
      <div className="glass-panel rounded-xl p-5 transition-all duration-200 hover:border-border-active">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Alertas Operacionais</h3>
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {withoutAccess > 0 && (
            <Link to="/app/admin/clientes" className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-white/5">
              <span className="flex items-center gap-2.5 text-[13px] text-text-secondary">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-amber/15"><Link2Off className="h-3.5 w-3.5 text-accent-amber" /></span>
                {withoutAccess} {withoutAccess === 1 ? 'cliente sem' : 'clientes sem'} acesso vinculado
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-accent-primary">Ver <ArrowUpRight className="h-3 w-3" /></span>
            </Link>
          )}
          {withoutAccess === 0 && <p className="py-2 text-sm text-text-secondary">Nenhuma pendência operacional disponível.</p>}
        </div>
      </div>
    </div>
  )
}

const colorMap = {
  cyan: 'bg-accent-primary/10 text-accent-primary',
  emerald: 'bg-accent-emerald/10 text-accent-emerald',
  violet: 'bg-accent-violet/10 text-accent-violet',
  blue: 'bg-accent-blue/10 text-accent-blue',
  amber: 'bg-accent-amber/10 text-accent-amber',
} as const

function KpiCard({ icon: Icon, color, value, label, onClick }: { icon: typeof Building; color: keyof typeof colorMap; value: number | string; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`enterprise-kpi flex flex-col items-start gap-1.5 rounded-lg p-3 text-left transition-colors hover:border-border-active ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}><Icon className="h-4 w-4" /></span>
      <p className="text-xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </button>
  )
}
