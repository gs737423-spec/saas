import {
  Link2,
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
import { useConnections, getMarketplaceColor, type IntegrationStatus } from '@/contexts/ConnectionContext'
import type { Marketplace } from '@/data/mockData'

const OTHER_MARKETPLACES: Marketplace[] = ['Shopee', 'Amazon', 'Loja Própria']

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
  expired: { label: 'Expirado', color: 'text-accent-amber', bg: 'bg-accent-amber/15', border: 'border-accent-amber/30', dotClass: 'bg-accent-amber' },
  config_missing: { label: 'Configuração pendente', color: 'text-accent-amber', bg: 'bg-accent-amber/15', border: 'border-accent-amber/30', dotClass: 'bg-accent-amber' },
}

function MercadoLivreCard() {
  const { mercadoLivre, loading, syncing, connectMercadoLivre, syncMercadoLivre } = useConnections()
  const color = getMarketplaceColor('Mercado Livre')

  if (loading || !mercadoLivre) {
    return (
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando status da conexão...
        </div>
      </div>
    )
  }

  const cfg = statusConfig[mercadoLivre.status]
  const isConfigMissing = mercadoLivre.status === 'config_missing'
  const isConnected = mercadoLivre.status === 'connected'
  const needsReconnect = mercadoLivre.status === 'error' || mercadoLivre.status === 'expired' || mercadoLivre.status === 'disconnected'

  return (
    <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute inset-x-0 top-0 h-10 opacity-25" style={{ background: `linear-gradient(to bottom, ${color}22, transparent)` }} />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}66` }} />
            <h3 className="text-sm font-semibold text-text-primary">Mercado Livre</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
            {cfg.label}
          </span>
        </div>

        {isConfigMissing && (
          <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-text-secondary">
            <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-amber" />
            Configuração pendente — adicione as credenciais do Mercado Livre na Vercel para ativar a conexão real.
          </p>
        )}

        {!isConfigMissing && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-text-muted">Última sync</span>
              <p className="font-medium text-text-secondary">{relativeTime(mercadoLivre.lastSyncAt)}</p>
            </div>
            <div>
              <span className="text-text-muted">Conta</span>
              <p className="truncate font-medium text-text-secondary">{mercadoLivre.externalAccountId ?? '—'}</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="mt-3 flex gap-4 text-[11px]">
            <div>
              <span className="text-text-muted">Produtos importados</span>
              <p className="text-sm font-semibold text-text-primary">{mercadoLivre.productsCount.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-text-muted">Estoque atualizado</span>
              <p className="text-sm font-semibold text-text-primary">{mercadoLivre.inventoryCount.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        )}

        {mercadoLivre.lastError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent-rose/25 bg-accent-rose/10 p-2.5 text-[11px] text-accent-rose">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{mercadoLivre.lastError}</span>
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
              onClick={connectMercadoLivre}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-emerald/25 bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald transition-colors hover:bg-accent-emerald/20"
            >
              <Wifi className="h-3.5 w-3.5" />
              {mercadoLivre.status === 'disconnected' ? 'Conectar Mercado Livre' : 'Reconectar'}
            </button>
          )}
          {isConnected && (
            <button
              onClick={() => syncMercadoLivre()}
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

function NotImplementedCard({ marketplace }: { marketplace: Marketplace }) {
  const color = getMarketplaceColor(marketplace)
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl opacity-70">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="text-sm font-semibold text-text-primary">{marketplace}</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Em breve
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-text-secondary">
          Integração ainda não implementada — sem OAuth real neste marketplace por enquanto.
        </p>
        <button disabled className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/40 px-3 py-2 text-xs font-semibold text-text-muted">
          Em breve
        </button>
      </div>
    </div>
  )
}

export default function Importacoes() {
  const { logs } = useConnections()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-accent-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Conexões com Marketplaces</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MercadoLivreCard />
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
          <div className="max-h-60 space-y-1 overflow-y-auto">
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
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-violet/10 text-accent-violet">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Como funciona a conexão real</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              O botão do Mercado Livre inicia um fluxo OAuth real: você autoriza no site oficial do Mercado Livre,
              o token é trocado e armazenado com segurança no backend (nunca no navegador), e a sincronização busca
              produtos e estoque reais da sua conta. Shopee, Amazon e Loja Própria ainda não têm integração real —
              aparecem como "Em breve" até terem OAuth implementado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
