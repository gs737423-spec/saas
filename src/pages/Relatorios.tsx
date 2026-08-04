import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { usePeriod } from '@/contexts/PeriodContext'
import { getExecutiveSummary, getExecutiveAlerts } from '@/data/mockData'
import KPICards from '@/components/dashboard/KPICards'
import MarketplaceComparison from '@/components/dashboard/MarketplaceComparison'
import MKTOnlineLogo from '@/components/brand/MKTOnlineLogo'

const toneColor: Record<string, string> = {
  neutral: '#9EB3C9',
  positive: '#3BE38E',
  warning: '#FFC95A',
  danger: '#FF5E7D',
}

function SlideShell({ children, index, total }: { children: React.ReactNode; index: number; total: number }) {
  return (
    <div className="report-slide glass-panel relative flex min-h-[520px] w-full flex-col rounded-2xl p-6 sm:p-10">
      {children}
      <span className="report-slide__page absolute bottom-4 right-6 text-[11px] text-text-muted">
        {index + 1} / {total}
      </span>
    </div>
  )
}

export default function Relatorios() {
  const { period } = usePeriod()
  const summary = getExecutiveSummary()
  const alerts = getExecutiveAlerts().slice(0, 6)
  const [slide, setSlide] = useState(0)

  const slides = [
    <SlideShell key="cover" index={0} total={5}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <MKTOnlineLogo mode="symbol" size="lg" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Relatório executivo</h1>
        <p className="text-sm text-text-secondary">Período: {period.label}</p>
        <p className="text-xs text-text-muted">Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </SlideShell>,

    <SlideShell key="kpis" index={1} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Indicadores do período</h2>
      <KPICards period={period} />
    </SlideShell>,

    <SlideShell key="gmv" index={2} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Faturamento por marketplace</h2>
      <MarketplaceComparison />
    </SlideShell>,

    <SlideShell key="summary" index={3} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Resumo executivo</h2>
      <ul className="flex flex-col gap-3">
        {summary.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneColor[line.tone] }} />
            {line.text}
          </li>
        ))}
      </ul>
    </SlideShell>,

    <SlideShell key="alerts" index={4} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Alertas prioritários</h2>
      <ul className="flex flex-col gap-3">
        {alerts.map((a) => (
          <li key={a.id} className="rounded-lg border border-border-subtle px-3 py-2.5">
            <p className="text-[13px] font-medium text-text-primary">{a.rule}</p>
            <p className="mt-0.5 text-xs text-text-muted">{a.message}</p>
          </li>
        ))}
        {alerts.length === 0 && <p className="text-sm text-text-muted">Nenhum alerta no momento.</p>}
      </ul>
    </SlideShell>,
  ]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  return (
    <div className="report-viewer">
      <div className="report-toolbar mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlide((s) => Math.max(s - 1, 0))}
            disabled={slide === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-text-muted">Slide {slide + 1} de {slides.length}</span>
          <button
            onClick={() => setSlide((s) => Math.min(s + 1, slides.length - 1))}
            disabled={slide === slides.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-border-default bg-accent-blue/10 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/20"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimir / exportar PDF
        </button>
      </div>

      <div className="report-onscreen">{slides[slide]}</div>
      <div className="report-print">{slides}</div>
    </div>
  )
}
