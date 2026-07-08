import { Upload, Download, CheckCircle2, Clock } from 'lucide-react'
import { marketplaceConnections, getMarketplaceColor } from '@/data/mockData'

export default function ImportacaoCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {marketplaceConnections.map((mc) => {
        const color = getMarketplaceColor(mc.name)
        return (
          <div key={mc.name} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${color}40, transparent 68%)` }}
            />
            <div className="relative mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {mc.name}
              </span>
              <span className="flex items-center gap-1 rounded-md bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-emerald">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </span>
            </div>
            <div className="relative mb-4 flex items-center gap-1.5 text-[11px] text-text-muted">
              <Clock className="h-3 w-3" />
              Última importação: {mc.lastSync}
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
