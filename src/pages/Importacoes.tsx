import {
  Link2,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Package,
  BarChart3,
  Star,
  Warehouse,
  Clock,
  Zap,
  Info,
} from 'lucide-react'
import { useConnections, getMarketplaceColor } from '@/contexts/ConnectionContext'
import type { Marketplace } from '@/data/mockData'

const INTERVAL_OPTIONS = [1, 5, 15, 30]

const DATA_TYPES = [
  { icon: ShoppingBag, label: 'Pedidos' },
  { icon: Package, label: 'Produtos' },
  { icon: Warehouse, label: 'Estoque' },
  { icon: BarChart3, label: 'Faturamento' },
  { icon: Star, label: 'Avaliações' },
]

function relativeTime(date: Date | null): string {
  if (!date) return 'Nunca'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 10) return 'agora'
  if (diff < 60) return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

function futureTime(date: Date | null): string {
  if (!date) return '—'
  const diff = Math.floor((date.getTime() - Date.now()) / 1000)
  if (diff <= 0) return 'agora'
  if (diff < 60) return `em ${diff}s`
  if (diff < 3600) return `em ${Math.floor(diff / 60)} min`
  return `em ${Math.floor(diff / 3600)}h`
}

const statusConfig = {
  connected: { label: 'Conectado', color: 'text-accent-emerald', bg: 'bg-accent-emerald/15', border: 'border-accent-emerald/30', dotClass: 'bg-accent-emerald' },
  disconnected: { label: 'Desconectado', color: 'text-text-muted', bg: 'bg-bg-card', border: 'border-border-subtle', dotClass: 'bg-text-muted' },
  syncing: { label: 'Sincronizando', color: 'text-accent-blue', bg: 'bg-accent-blue/15', border: 'border-accent-blue/30', dotClass: 'bg-accent-blue animate-pulse' },
  error: { label: 'Erro', color: 'text-accent-rose', bg: 'bg-accent-rose/15', border: 'border-accent-rose/30', dotClass: 'bg-accent-rose' },
} as const

function MarketplaceCard({ marketplace }: { marketplace: Marketplace }) {
  const { connections, connect, disconnect, syncNow, setSyncInterval } = useConnections()
  const conn = connections.find(c => c.marketplace === marketplace)!
  const color = getMarketplaceColor(marketplace)
  const cfg = statusConfig[conn.status]

  return (
    <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl">
      {/* Colored top glow */}
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute inset-x-0 top-0 h-10 opacity-25" style={{ background: `linear-gradient(to bottom, ${color}22, transparent)` }} />

      <div className="relative p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}66` }}
            />
            <h3 className="text-sm font-semibold text-text-primary">{marketplace}</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
            {cfg.label}
          </span>
        </div>

        {/* Sync info */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-text-muted">Última sync</span>
            <p className="font-medium text-text-secondary">{relativeTime(conn.lastSync)}</p>
          </div>
          <div>
            <span className="text-text-muted">Próxima sync</span>
            <p className="font-medium text-text-secondary">{futureTime(conn.nextSync)}</p>
          </div>
        </div>

        {/* Counts */}
        {conn.status !== 'disconnected' && (
          <div className="mt-3 flex gap-4 text-[11px]">
            <div>
              <span className="text-text-muted">Produtos</span>
              <p className="text-sm font-semibold text-text-primary">{conn.productsCount.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-text-muted">Pedidos</span>
              <p className="text-sm font-semibold text-text-primary">{conn.ordersCount.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        )}

        {/* Interval selector */}
        <div className="mt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Intervalo de sync</span>
          <div className="mt-1.5 flex gap-1.5">
            {INTERVAL_OPTIONS.map(min => (
              <button
                key={min}
                onClick={() => setSyncInterval(marketplace, min)}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                  conn.syncInterval === min
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                    : 'bg-bg-card border border-border-subtle text-text-muted hover:text-text-secondary'
                }`}
              >
                {min}min
              </button>
            ))}
          </div>
        </div>

        {/* Syncing progress */}
        {conn.status === 'syncing' && (
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-bg-card">
              <div className="h-full w-full animate-pulse rounded-full bg-accent-blue/60" style={{ animation: 'pulse 1s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {conn.status === 'disconnected' ? (
            <button
              onClick={() => connect(marketplace)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-emerald/25 bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald transition-colors hover:bg-accent-emerald/20"
            >
              <Wifi className="h-3.5 w-3.5" />
              Conectar
            </button>
          ) : (
            <>
              <button
                onClick={() => syncNow(marketplace)}
                disabled={conn.status === 'syncing'}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-blue/25 bg-accent-blue/10 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20 disabled:opacity-40"
              >
                {conn.status === 'syncing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar
              </button>
              <button
                onClick={() => disconnect(marketplace)}
                disabled={conn.status === 'syncing'}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-accent-rose/25 bg-accent-rose/10 px-3 py-2 text-xs font-semibold text-accent-rose transition-colors hover:bg-accent-rose/20 disabled:opacity-40"
              >
                <WifiOff className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Importacoes() {
  const { globalSyncStatus, syncAll, syncLog, connections } = useConnections()

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-accent-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Conexões com Marketplaces</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-amber/25 bg-accent-amber/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-amber">
          <Info className="h-3 w-3" />
          Demonstração
        </span>
      </div>

      {/* Global sync status bar */}
      <div className="overview-glass-elevated overview-card-hover flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Status Global</p>
            <p className="text-xs text-text-secondary">
              <span className="text-accent-emerald font-medium">{globalSyncStatus.connectedCount}</span> conectado{globalSyncStatus.connectedCount !== 1 ? 's' : ''}
              {globalSyncStatus.syncingCount > 0 && <> · <span className="text-accent-blue font-medium">{globalSyncStatus.syncingCount}</span> sincronizando</>}
              {globalSyncStatus.errorCount > 0 && <> · <span className="text-accent-rose font-medium">{globalSyncStatus.errorCount}</span> com erro</>}
              {globalSyncStatus.connectedCount === 0 && globalSyncStatus.syncingCount === 0 && ' · Nenhum canal ativo'}
            </p>
          </div>
        </div>
        <button
          onClick={syncAll}
          disabled={globalSyncStatus.connectedCount === 0}
          className="flex items-center gap-2 rounded-lg border border-accent-cyan/25 bg-accent-cyan/10 px-4 py-2 text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar Tudo
        </button>
      </div>

      {/* Marketplace cards grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria'] as Marketplace[]).map(mp => (
          <MarketplaceCard key={mp} marketplace={mp} />
        ))}
      </div>

      {/* Sync activity log */}
      {syncLog.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-text-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Atividade recente</h3>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {syncLog.slice(0, 15).map(entry => {
              const color = getMarketplaceColor(entry.marketplace)
              return (
                <div key={entry.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[11px] hover:bg-bg-card/60">
                  {entry.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-accent-rose" />
                  )}
                  <span className="shrink-0 font-medium" style={{ color }}>{entry.marketplace}</span>
                  <span className="text-text-secondary">{entry.action}</span>
                  <span className="ml-auto shrink-0 text-text-muted">{relativeTime(entry.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* API Configuration info */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-violet/10 text-accent-violet">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Como vai funcionar a conexão via API</p>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              Esta tela está em modo de demonstração: os botões simulam o fluxo de conexão e sincronização
              com dados fictícios. A integração real (autenticação OAuth com cada marketplace e sincronização
              automática de pedidos, produtos, estoque e faturamento) ainda precisa ser implementada.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DATA_TYPES.map(dt => (
                <span key={dt.label} className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card/60 px-2.5 py-1 text-[10px] font-medium text-text-secondary">
                  <dt.icon className="h-3 w-3 text-text-muted" />
                  {dt.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
