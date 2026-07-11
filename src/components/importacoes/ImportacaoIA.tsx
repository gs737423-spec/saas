import { Sparkles } from 'lucide-react'

export default function ImportacaoIA() {
  return (
    <div className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: 'radial-gradient(circle, #9061F945, transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full opacity-30 blur-2xl"
        style={{ background: 'radial-gradient(circle, #22D3EE22, transparent 70%)' }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: '#9061F914', boxShadow: '0 0 24px -5px #9061F999, inset 0 0 0 1px #9061F933' }}>
          <Sparkles className="h-5 w-5 text-accent-violet" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-text-primary">Importação Inteligente com IA</h3>
            <span className="rounded-full border border-accent-violet/20 bg-accent-violet/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-violet">Em breve</span>
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-text-secondary">
            No futuro, a plataforma vai ler automaticamente planilhas em diferentes formatos e layouts, sugerir o mapeamento de colunas mesmo com nomes divergentes, e gerar relatórios de importação com resumo de inconsistências — sem exigir um modelo fixo de arquivo.
          </p>
        </div>
      </div>
    </div>
  )
}
