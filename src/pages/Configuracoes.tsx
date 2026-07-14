import { RotateCcw, SlidersHorizontal, Gauge, Boxes } from 'lucide-react'
import {
  useInventorySettings,
  DEFAULT_INVENTORY_SETTINGS,
  type GiroColors,
  type CoverageColors,
} from '@/contexts/InventorySettingsContext'
import type { TurnoverStatus } from '@/data/mockData'
import type { CoverageLabel } from '@/contexts/InventorySettingsContext'

const giroOrder: TurnoverStatus[] = ['Normal', 'Lento', 'Parado', 'Parado crítico']
const giroHint: Record<TurnoverStatus, string> = {
  'Normal': 'Giro saudável',
  'Lento': 'Giro abaixo do ideal',
  'Parado': 'Sem giro relevante',
  'Parado crítico': 'Capital parado há muito tempo',
}

const coverageOrder: CoverageLabel[] = ['Crítico', 'Atenção', 'Saudável', 'Excesso']
const coverageHint: Record<CoverageLabel, string> = {
  'Crítico': 'Risco de ruptura iminente',
  'Atenção': 'Cobertura ficando curta',
  'Saudável': 'Cobertura dentro do esperado',
  'Excesso': 'Capital parado em estoque acima do necessário',
}

function NumberField({ label, value, onChange, min, max, suffix = 'dias' }: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          step="1"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent-blue/50"
        />
        <span className="shrink-0 text-xs text-text-muted">{suffix}</span>
      </div>
    </div>
  )
}

function ColorSwatch({ label, hint, color, onChange }: { label: string; hint: string; color: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-transparent p-0.5"
      />
      <div className="min-w-0">
        <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color, background: `${color}1F` }}>
          {label}
        </span>
        <p className="mt-1 truncate text-[10px] text-text-muted">{hint}</p>
      </div>
    </div>
  )
}

function SectionShell({ icon: Icon, title, description, onReset, children }: {
  icon: typeof Gauge
  title: string
  description: string
  onReset: () => void
  children: React.ReactNode
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
            <Icon className="h-[18px] w-[18px] text-accent-blue" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-primary">{title}</h3>
            <p className="mt-0.5 text-xs text-text-muted">{description}</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-border-default hover:text-text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar padrão
        </button>
      </div>
      {children}
    </div>
  )
}

export default function Configuracoes() {
  const { settings, setSettings } = useInventorySettings()

  const updateGiroThreshold = (key: keyof typeof settings.giro.thresholds, value: number) => {
    setSettings({ ...settings, giro: { ...settings.giro, thresholds: { ...settings.giro.thresholds, [key]: value } } })
  }
  const updateGiroColor = (status: TurnoverStatus, value: string) => {
    setSettings({ ...settings, giro: { ...settings.giro, colors: { ...settings.giro.colors, [status]: value } as GiroColors } })
  }

  const updateCoverageThreshold = (key: keyof typeof settings.coverage.thresholds, value: number) => {
    setSettings({ ...settings, coverage: { ...settings.coverage, thresholds: { ...settings.coverage.thresholds, [key]: value } } })
  }
  const updateCoverageColor = (label: CoverageLabel, value: string) => {
    setSettings({ ...settings, coverage: { ...settings.coverage, colors: { ...settings.coverage.colors, [label]: value } as CoverageColors } })
  }

  const updateStockRule = (key: keyof typeof settings.stock, value: number) => {
    setSettings({ ...settings, stock: { ...settings.stock, [key]: value } })
  }

  const resetGiro = () => setSettings({ ...settings, giro: DEFAULT_INVENTORY_SETTINGS.giro })
  const resetCoverage = () => setSettings({ ...settings, coverage: DEFAULT_INVENTORY_SETTINGS.coverage })
  const resetStock = () => setSettings({ ...settings, stock: DEFAULT_INVENTORY_SETTINGS.stock })

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-text-primary">Configurações</h2>
        <p className="mt-0.5 text-sm text-text-muted">Preferências da plataforma — ajustadas aqui refletem em todo o módulo de Estoque.</p>
      </div>

      {/* Giro — por dias de cobertura */}
      <SectionShell
        icon={SlidersHorizontal}
        title="Indicadores de Giro"
        description="Classificado pelos dias de cobertura do produto: menos dias = giro mais rápido. Defina as faixas e as cores."
        onReset={resetGiro}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField label="Normal até" value={settings.giro.thresholds.normalMaxDays} min={1} max={settings.giro.thresholds.lentoMaxDays} onChange={(v) => updateGiroThreshold('normalMaxDays', Math.min(v, settings.giro.thresholds.lentoMaxDays))} />
          <NumberField label="Lento até" value={settings.giro.thresholds.lentoMaxDays} min={settings.giro.thresholds.normalMaxDays} max={settings.giro.thresholds.paradoMaxDays} onChange={(v) => updateGiroThreshold('lentoMaxDays', Math.min(Math.max(v, settings.giro.thresholds.normalMaxDays), settings.giro.thresholds.paradoMaxDays))} />
          <NumberField label="Parado até" value={settings.giro.thresholds.paradoMaxDays} min={settings.giro.thresholds.lentoMaxDays} onChange={(v) => updateGiroThreshold('paradoMaxDays', Math.max(v, settings.giro.thresholds.lentoMaxDays))} />
        </div>
        <p className="mt-2 text-[10px] text-text-muted">Acima de {settings.giro.thresholds.paradoMaxDays} dias sem girar = "Parado crítico".</p>

        <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {giroOrder.map((status) => (
            <ColorSwatch key={status} label={status} hint={giroHint[status]} color={settings.giro.colors[status]} onChange={(v) => updateGiroColor(status, v)} />
          ))}
        </div>
      </SectionShell>

      {/* Cobertura — risco de ruptura x excesso */}
      <SectionShell
        icon={Gauge}
        title="Indicadores de Cobertura"
        description="Faixas de risco de ruptura e excesso de estoque, em dias de cobertura projetada."
        onReset={resetCoverage}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField label="Crítico até" value={settings.coverage.thresholds.criticoMaxDays} min={1} max={settings.coverage.thresholds.atencaoMaxDays} onChange={(v) => updateCoverageThreshold('criticoMaxDays', Math.min(v, settings.coverage.thresholds.atencaoMaxDays))} />
          <NumberField label="Atenção até" value={settings.coverage.thresholds.atencaoMaxDays} min={settings.coverage.thresholds.criticoMaxDays} max={settings.coverage.thresholds.saudavelMaxDays} onChange={(v) => updateCoverageThreshold('atencaoMaxDays', Math.min(Math.max(v, settings.coverage.thresholds.criticoMaxDays), settings.coverage.thresholds.saudavelMaxDays))} />
          <NumberField label="Saudável até" value={settings.coverage.thresholds.saudavelMaxDays} min={settings.coverage.thresholds.atencaoMaxDays} onChange={(v) => updateCoverageThreshold('saudavelMaxDays', Math.max(v, settings.coverage.thresholds.atencaoMaxDays))} />
        </div>
        <p className="mt-2 text-[10px] text-text-muted">Acima de {settings.coverage.thresholds.saudavelMaxDays} dias = "Excesso".</p>

        <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {coverageOrder.map((label) => (
            <ColorSwatch key={label} label={label} hint={coverageHint[label]} color={settings.coverage.colors[label]} onChange={(v) => updateCoverageColor(label, v)} />
          ))}
        </div>
      </SectionShell>

      {/* Regras de KPI do Estoque */}
      <SectionShell
        icon={Boxes}
        title="Regras dos Cards de Estoque"
        description="Limiares usados nos cards de resumo da página Estoque."
        onReset={resetStock}
      >
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">
          <NumberField
            label="Estoque crítico quando cobertura ≤"
            value={settings.stock.criticalStockDays}
            min={1}
            onChange={(v) => updateStockRule('criticalStockDays', Math.max(1, v))}
          />
          <NumberField
            label="Excesso de estoque quando cobertura >"
            value={settings.stock.excessStockDays}
            min={1}
            onChange={(v) => updateStockRule('excessStockDays', Math.max(1, v))}
          />
          <NumberField
            label='"Sem entrada recente" após'
            value={settings.stock.noRecentEntryDays}
            min={1}
            onChange={(v) => updateStockRule('noRecentEntryDays', Math.max(1, v))}
          />
        </div>
      </SectionShell>

      <p className="text-[11px] text-text-muted">Tudo aqui é salvo automaticamente neste navegador e aplicado em toda a página Estoque.</p>
    </div>
  )
}
