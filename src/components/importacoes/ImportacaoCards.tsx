import { Upload, Download, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { importSourceStatus, getMarketplaceColor, type ImportSourceStatus } from '@/data/mockData'

const statusConfig: Record<ImportSourceStatus['status'], { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  conectado: { label: 'Conectado', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', icon: CheckCircle2 },
  atualizado: { label: 'Atualizado', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', icon: RefreshCw },
  pendente: { label: 'Pendente', color: 'text-accent-amber', bg: 'bg-accent-amber/10', icon: Clock },
  erro: { label: 'Erro', color: 'text-accent-rose', bg: 'bg-accent-rose/10', icon: AlertCircle },
}

export default function ImportacaoCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {importSourceStatus.map((mc) => {
        const color = getMarketplaceColor(mc.marketplace)
        const cfg = statusConfig[mc.status]
        const StatusIcon = cfg.icon
        return (
          <div key={mc.marketplace} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${color}40, transparent 68%)` }}
            />
            <div className="relative mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: `${color}20`, color }}>
                  {mc.marketplace.slice(0, 2).toUpperCase()}
                </span>
                {mc.marketplace}
              </span>
              <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                <StatusIcon className="h-3 w-3" />
                {cfg.label}
              </span>
            </div>

            <div className="relative mb-1 flex items-center gap-1.5 text-[11px] text-text-muted">
              <Clock className="h-3 w-3" />
              Última importação: {mc.lastImport}
            </div>
            <div className="relative mb-4 text-[11px] text-text-muted">
              <span className="font-mono text-text-secondary">{mc.recordsImported.toLocaleString('pt-BR')}</span> registros importados
            </div>

            <div className="relative flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-blue/10 px-2.5 py-2 text-[11px] font-medium text-accent-blue transition-colors hover:bg-accent-blue/20">
                <Upload className="h-3.5 w-3.5" />
                Enviar arquivo
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-2.5 py-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary">
                <Download className="h-3.5 w-3.5" />
                Baixar modelo
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
