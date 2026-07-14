import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useInventorySettings, type TurnoverColors } from '@/contexts/InventorySettingsContext'
import type { TurnoverStatus } from '@/data/mockData'

const statusOrder: TurnoverStatus[] = ['Normal', 'Lento', 'Parado', 'Parado crítico']

const statusHint: Record<TurnoverStatus, string> = {
  'Normal': 'Giro saudável',
  'Lento': 'Giro abaixo do ideal',
  'Parado': 'Sem giro relevante',
  'Parado crítico': 'Capital parado há muito tempo',
}

export default function Configuracoes() {
  const { settings, setSettings, resetSettings } = useInventorySettings()

  const updateThreshold = (key: keyof typeof settings.thresholds, value: number) => {
    setSettings({ ...settings, thresholds: { ...settings.thresholds, [key]: value } })
  }

  const updateColor = (status: TurnoverStatus, value: string) => {
    setSettings({ ...settings, colors: { ...settings.colors, [status]: value } as TurnoverColors })
  }

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-text-primary">Configurações</h2>
        <p className="mt-0.5 text-sm text-text-muted">Preferências da plataforma.</p>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
              <SlidersHorizontal className="h-[18px] w-[18px] text-accent-blue" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-text-primary">Indicadores de Giro</h3>
              <p className="mt-0.5 text-xs text-text-muted">Defina as faixas de giro (vendas ÷ estoque médio) e as cores usadas no Estoque.</p>
            </div>
          </div>
          <button
            onClick={resetSettings}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-border-default hover:text-text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrão
          </button>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Giro mínimo · Normal</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min={settings.thresholds.lentoMin}
                value={settings.thresholds.normalMin}
                onChange={(e) => updateThreshold('normalMin', Math.max(settings.thresholds.lentoMin, Number(e.target.value)))}
                className="w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent-blue/50"
              />
              <span className="shrink-0 text-xs text-text-muted">x</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Giro mínimo · Lento</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min={settings.thresholds.paradoMin}
                max={settings.thresholds.normalMin}
                value={settings.thresholds.lentoMin}
                onChange={(e) => updateThreshold('lentoMin', Math.min(settings.thresholds.normalMin, Math.max(settings.thresholds.paradoMin, Number(e.target.value))))}
                className="w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent-blue/50"
              />
              <span className="shrink-0 text-xs text-text-muted">x</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Giro mínimo · Parado</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min={0}
                max={settings.thresholds.lentoMin}
                value={settings.thresholds.paradoMin}
                onChange={(e) => updateThreshold('paradoMin', Math.min(settings.thresholds.lentoMin, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent-blue/50"
              />
              <span className="shrink-0 text-xs text-text-muted">x</span>
            </div>
            <p className="mt-1 text-[10px] text-text-muted">Abaixo disso = "Parado crítico"</p>
          </div>
        </div>

        {/* Colors + live preview */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusOrder.map((status) => (
            <div key={status} className="flex items-center gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
              <input
                type="color"
                value={settings.colors[status]}
                onChange={(e) => updateColor(status, e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-transparent p-0.5"
              />
              <div className="min-w-0">
                <span
                  className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color: settings.colors[status], background: `${settings.colors[status]}1F` }}
                >
                  {status}
                </span>
                <p className="mt-1 truncate text-[10px] text-text-muted">{statusHint[status]}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-text-muted">
          Aplicado em toda a página Estoque — salvo automaticamente neste navegador.
        </p>
      </div>
    </div>
  )
}
