import { FileCheck2, FileSpreadsheet, Link2 } from 'lucide-react'
import ImportacaoCards from '@/components/importacoes/ImportacaoCards'
import ComoFunciona from '@/components/importacoes/ComoFunciona'
import ImportacaoHistorico from '@/components/importacoes/ImportacaoHistorico'
import ImportacaoIA from '@/components/importacoes/ImportacaoIA'
import MarketplaceConnections from '@/components/importacoes/MarketplaceConnections'

export default function Importacoes() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 pt-1">
        <FileSpreadsheet className="h-4 w-4 text-accent-blue" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Importação manual por planilha</span>
      </div>

      <ImportacaoCards />

      <ComoFunciona />

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-emerald/10 text-accent-emerald">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">Validação de arquivos</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Arquivos são validados automaticamente antes da importação: colunas obrigatórias, formatos de SKU e valores numéricos.
            Formatos aceitos: <span className="font-mono text-text-primary">.xlsx</span>, <span className="font-mono text-text-primary">.xls</span>, <span className="font-mono text-text-primary">.csv</span>.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-[11px] font-medium text-accent-blue">
          Conexão via API em breve
        </span>
      </div>

      <ImportacaoHistorico />

      <div className="flex items-center gap-2 pt-2">
        <Link2 className="h-4 w-4 text-accent-cyan" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Conexão direta com marketplaces</span>
      </div>

      <MarketplaceConnections />

      <ImportacaoIA />
    </div>
  )
}
