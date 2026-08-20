import {
  RefreshCw,
  Wifi,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
  Settings,
} from 'lucide-react'
import { useConnections, getMarketplaceColor, type IntegrationStatus, type MercadoLivreStatus, type ShopeeStatus } from '@/contexts/ConnectionContext'
import type { Marketplace } from '@/data/mockData'
import DataTableViewport from '@/components/common/DataTableViewport'
import { LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLojaPropria } from '@/site/logos'
import VtexConnectionCard from '@/components/importacoes/VtexConnectionCard'
import VtexChannelMappingCard from '@/components/importacoes/VtexChannelMappingCard'

const OTHER_MARKETPLACES: Marketplace[] = ['Amazon', 'Loja Própria']

const MARKETPLACE_LOGO: Record<Marketplace, React.ComponentType> = {
  'Mercado Livre': LogoMercadoLivre,
  'Shopee': LogoShopee,
  'Amazon': LogoAmazon,
  'Loja Própria': LogoLojaPropria,
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Nunca'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 10) return 'agora'
  if (diff < 60) return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

const statusConfig: Record<IntegrationStatus, { label: string; color: string; bg: string; border: string; dotClass: string }> = {
  connected: { label: 'Conectado', color: 'text-accent-emerald', bg: 'bg-accent-emerald/15', border: 'border-accent-emerald/30', dotClass: 'bg-accent-emerald' },
  disconnected: { label: 'Desconectado', color: 'text-text-muted', bg: 'bg-bg-card', border: 'border-border-subtle', dotClass: 'bg-text-muted' },
  pending: { label: 'Pendente', color: 'text-accent-blue', bg: 'bg-accent-blue/15', border: 'border-accent-blue/30', dotClass: 'bg-accent-blue animate-pulse' },
  error: { label: 'Erro', color: 'text-accent-rose', bg: 'bg-accent-rose/15', border: 'border-accent-rose/30', dotClass: 'bg-accent-rose' },
  connecting: { label: 'Conectando', color: 'text-accent-blue', bg: 'bg-accent-blue/15', border: 'border-accent-blue/30', dotClass: 'bg-accent-blue animate-pulse' },
  syncing: { label: 'Sincronizando', color: 'text-accent-blue', bg: 'bg-accent-blue/15', border: 'border-accent-blue/30', dotClass: 'bg-accent-blue animate-pulse' },
  requires_attention: { label: 'Requer atenção', color: 'text-accent-rose', bg: 'bg-accent-rose/15', border: 'border-accent-rose/30', dotClass: 'bg-accent-rose' },
  expired: { label: 'Expirado', color: 'text-accent-amber', bg: 'bg-accent-amber/15', border: 'border-accent-amber/30', dotClass: 'bg-accent-amber' },
  config_missing: { label: 'Configuração pendente', color: 'text-accent-amber', bg: 'bg-accent-amber/15', border: 'border-accent-amber/30', dotClass: 'bg-accent-amber' },
}

interface MarketplaceCardProps {
  name: Marketplace
  status: MercadoLivreStatus | ShopeeStatus | null
  loading: boolean
  syncing: boolean
  connectError: string | null
  onConnect: () => void
  onSync: () => void
}

function MarketplaceCard({ name, status, loading, syncing, connectError, onConnect, onSync }: MarketplaceCardProps) {
  const { backendUnreachable } = useConnections()
  const color = getMarketplaceColor(name)
  const Logo = MARKETPLACE_LOGO[name]

  if (loading) {
    return (
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando status da conexão...
        </div>
      </div>
    )
  }

  if (backendUnreachable || !status) {
    return (
      <div className="connection-card glass-panel relative overflow-hidden rounded-md p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"><Logo /></span>
            <div><h3 className="text-sm font-semibold text-text-primary">{name}</h3><p className="text-[11px] text-text-muted">Status temporariamente indisponível</p></div>
          </div>
          <span className="rounded-full border border-border-subtle bg-bg-highlight px-2 py-1 text-[10px] font-semibold text-text-secondary">Requer atenção</span>
        </div>
      </div>
    )
  }

  const cfg = statusConfig[status.status]
  const isConfigMissing = status.status === 'config_missing'
  const isConnected = status.status === 'connected'
  const needsReconnect = status.status === 'error' || status.status === 'expired' || status.status === 'disconnected'

  return (
    <div className="connection-card glass-panel glass-panel-hover motion-card-tight group relative overflow-hidden rounded-md">

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ boxShadow: `0 0 0 1px ${color}33` }}>
              <Logo />
            </span>
            <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
            {cfg.label}
          </span>
        </div>

        {isConfigMissing && (
          <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-text-secondary">
            <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-amber" />
            A integração ainda precisa ser configurada pela equipe responsável.
          </p>
        )}

        {!isConfigMissing && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-text-muted">Última sync</span>
              <p className="font-medium text-text-secondary">{relativeTime(status.lastSyncAt)}</p>
            </div>
            <div>
              <span className="text-text-muted">Conta</span>
              <p className="truncate font-medium text-text-secondary">{status.externalAccountId ?? '—'}</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="mt-3 flex gap-4 text-[11px]">
            <div>
              <span className="text-text-muted">Produtos importados</span>
              <p className="text-sm font-semibold text-text-primary">{status.productsCount.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-text-muted">Estoque atualizado</span>
              <p className="text-sm font-semibold text-text-primary">{status.inventoryCount.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-text-muted">Pedidos importados</span>
              <p className="text-sm font-semibold text-text-primary">{status.ordersCount.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        )}

        {connectError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-rose/25 bg-accent-rose/10 p-2.5 text-[11px] text-accent-rose">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Não foi possível concluir a conexão. Tente novamente em alguns instantes.</span>
          </div>
        )}

        {status.lastError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-rose/25 bg-accent-rose/10 p-2.5 text-[11px] text-accent-rose">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>A última sincronização não foi concluída. Tente sincronizar novamente.</span>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {isConfigMissing && (
            <button disabled className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/40 px-3 py-2 text-xs font-semibold text-text-muted">
              <Settings className="h-3.5 w-3.5" />
              Configuração pendente
            </button>
          )}
          {needsReconnect && !isConfigMissing && (
            <button
              onClick={onConnect}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-emerald/25 bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald transition-colors hover:bg-accent-emerald/20"
            >
              <Wifi className="h-3.5 w-3.5" />
              {status.status === 'disconnected' ? `Conectar ${name}` : 'Reconectar'}
            </button>
          )}
          {isConnected && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-blue/25 bg-accent-blue/10 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20 disabled:opacity-40"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sincronizar agora
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MercadoLivreCard() {
  const { mercadoLivre, loading, syncing, connectError, connectMercadoLivre, syncMercadoLivre } = useConnections()
  return (
    <MarketplaceCard
      name="Mercado Livre"
      status={mercadoLivre}
      loading={loading}
      syncing={syncing}
      connectError={connectError}
      onConnect={connectMercadoLivre}
      onSync={() => syncMercadoLivre()}
    />
  )
}

function ShopeeCard() {
  const { shopee, loading, syncingShopee, connectErrorShopee, connectShopee, syncShopee } = useConnections()
  return (
    <MarketplaceCard
      name="Shopee"
      status={shopee}
      loading={loading}
      syncing={syncingShopee}
      connectError={connectErrorShopee}
      onConnect={connectShopee}
      onSync={() => syncShopee()}
    />
  )
}

function NotImplementedCard({ marketplace }: { marketplace: Marketplace }) {
  const color = getMarketplaceColor(marketplace)
  const Logo = MARKETPLACE_LOGO[marketplace]
  return (
    <div className="connection-card connection-card--disabled glass-panel relative overflow-hidden rounded-md">
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg grayscale" style={{ boxShadow: `0 0 0 1px ${color}33` }}>
              <Logo />
            </span>
            <h3 className="text-sm font-semibold text-text-primary">{marketplace}</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Em breve
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-text-secondary">Esta conexão ficará disponível em uma próxima etapa.</p>
      </div>
    </div>
  )
}

export default function Importacoes() {
  const { logs, backendUnreachable } = useConnections()

  return (
    <div className="enterprise-page">
      {backendUnreachable && (
        <div className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5 text-[12.5px] text-text-secondary" role="status">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-rose" />
          <div><p className="font-semibold text-text-primary">Não foi possível verificar o status das conexões.</p><p className="mt-0.5 text-[11.5px] text-text-muted">Tente novamente em alguns instantes.</p></div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <MercadoLivreCard />
        <ShopeeCard />
        <VtexConnectionCard />
        <VtexChannelMappingCard />
        {OTHER_MARKETPLACES.map((mp) => (
          <NotImplementedCard key={mp} marketplace={mp} />
        ))}
      </div>

      {logs.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Atividade recente</h3>
          </div>
          <DataTableViewport size="small" stickyHeader={false} ariaLabel="Atividade recente das conexões. Role para visualizar mais registros." className="space-y-1 rounded-lg">
            {logs.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[11px] hover:bg-bg-card/60">
                {entry.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />}
                {entry.status === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-accent-rose" />}
                {entry.status === 'info' && <Info className="h-3.5 w-3.5 shrink-0 text-accent-blue" />}
                <span className="shrink-0 font-medium text-text-secondary">{entry.eventType}</span>
                <span className="truncate text-text-secondary">{entry.message}</span>
                <span className="ml-auto shrink-0 text-text-muted">{relativeTime(entry.createdAt)}</span>
              </div>
            ))}
          </DataTableViewport>
        </div>
      )}
    </div>
  )
}
