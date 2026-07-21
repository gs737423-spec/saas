import { Download, FileSpreadsheet, Upload, ShieldCheck, RefreshCw } from 'lucide-react'

const steps = [
  { icon: Download, label: 'Baixar modelo', color: '#3568F5' },
  { icon: FileSpreadsheet, label: 'Preencher ou exportar dados', color: '#73C6FA' },
  { icon: Upload, label: 'Enviar arquivo', color: '#9061F9' },
  { icon: ShieldCheck, label: 'Validar dados', color: '#F5A524' },
  { icon: RefreshCw, label: 'Atualizar dashboard', color: '#16C784' },
]

export default function ComoFunciona() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Como Funciona</h3>
        <p className="mt-0.5 text-xs text-text-muted">Do arquivo à atualização do dashboard, em 5 passos</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="relative flex items-center gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${s.color}14`, boxShadow: `0 0 20px -5px ${s.color}99, inset 0 0 0 1px ${s.color}33` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: s.color }} />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">Passo {i + 1}</span>
                <span className="text-[12.5px] font-medium leading-tight text-text-primary">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
