import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { TurnoverStatus, CoverageStatus } from '@/data/mockData'

/** Giro — classificado por dias de cobertura (menor = gira mais rápido = melhor). */
export interface GiroThresholds {
  normalMaxDays: number
  lentoMaxDays: number
  paradoMaxDays: number
}

export interface GiroColors {
  Normal: string
  Lento: string
  Parado: string
  'Parado crítico': string
}

/** Cobertura — faixa de risco de ruptura x excesso, também em dias. */
export interface CoverageThresholds {
  criticoMaxDays: number
  atencaoMaxDays: number
  saudavelMaxDays: number
}

export type CoverageLabel = 'Crítico' | 'Atenção' | 'Saudável' | 'Excesso'

export interface CoverageColors {
  'Crítico': string
  'Atenção': string
  'Saudável': string
  'Excesso': string
}

/** Limiares operacionais avulsos usados nos cards de KPI do Estoque. */
export interface StockRules {
  /** Estoque considerado "crítico" (ruptura iminente) quando cobertura ≤ N dias. */
  criticalStockDays: number
  /** Estoque considerado "excesso" quando cobertura > N dias. */
  excessStockDays: number
  /** Dias sem entrada de mercadoria para contar como "sem entrada recente". */
  noRecentEntryDays: number
}

export interface InventorySettings {
  giro: { thresholds: GiroThresholds; colors: GiroColors }
  coverage: { thresholds: CoverageThresholds; colors: CoverageColors }
  stock: StockRules
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  giro: {
    thresholds: { normalMaxDays: 20, lentoMaxDays: 45, paradoMaxDays: 90 },
    colors: {
      Normal: '#16C784',
      Lento: '#F5A524',
      Parado: '#9061F9',
      'Parado crítico': '#8B2942',
    },
  },
  coverage: {
    thresholds: { criticoMaxDays: 7, atencaoMaxDays: 20, saudavelMaxDays: 45 },
    colors: {
      'Crítico': '#F4436C',
      'Atenção': '#F5C24B',
      'Saudável': '#16C784',
      'Excesso': '#22D3EE',
    },
  },
  stock: {
    criticalStockDays: 7,
    excessStockDays: 45,
    noRecentEntryDays: 60,
  },
}

const STORAGE_KEY = 'acelera_inventory_settings'

interface InventorySettingsContextValue {
  settings: InventorySettings
  setSettings: (next: InventorySettings) => void
  resetSettings: () => void
  /** Classifica o giro pelos dias de cobertura do item (não pela taxa de giro). */
  classifyGiro: (coverageDays: number) => TurnoverStatus
  giroColorFor: (status: TurnoverStatus) => { color: string; bg: string }
  classifyCoverage: (coverageDays: number) => CoverageStatus
  coverageColorFor: (label: CoverageLabel) => { color: string; bg: string }
}

const InventorySettingsContext = createContext<InventorySettingsContextValue | null>(null)

function mergeSettings(stored: Partial<InventorySettings> | null): InventorySettings {
  if (!stored) return DEFAULT_INVENTORY_SETTINGS
  return {
    giro: {
      thresholds: { ...DEFAULT_INVENTORY_SETTINGS.giro.thresholds, ...stored.giro?.thresholds },
      colors: { ...DEFAULT_INVENTORY_SETTINGS.giro.colors, ...stored.giro?.colors },
    },
    coverage: {
      thresholds: { ...DEFAULT_INVENTORY_SETTINGS.coverage.thresholds, ...stored.coverage?.thresholds },
      colors: { ...DEFAULT_INVENTORY_SETTINGS.coverage.colors, ...stored.coverage?.colors },
    },
    stock: { ...DEFAULT_INVENTORY_SETTINGS.stock, ...stored.stock },
  }
}

function loadStored(): InventorySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_INVENTORY_SETTINGS
    return mergeSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_INVENTORY_SETTINGS
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Lets whoever is renting the platform tune what counts as "slow" or
// "stalled" inventory, plus coverage risk bands and a few KPI thresholds —
// instead of a hardcoded scale. Persisted client-side via localStorage.
export function InventorySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<InventorySettings>(loadStored)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setSettings = (next: InventorySettings) => setSettingsState(next)
  const resetSettings = () => setSettingsState(DEFAULT_INVENTORY_SETTINGS)

  const classifyGiro = (coverageDays: number): TurnoverStatus => {
    const { normalMaxDays, lentoMaxDays, paradoMaxDays } = settings.giro.thresholds
    if (coverageDays <= normalMaxDays) return 'Normal'
    if (coverageDays <= lentoMaxDays) return 'Lento'
    if (coverageDays <= paradoMaxDays) return 'Parado'
    return 'Parado crítico'
  }

  const giroColorFor = (status: TurnoverStatus) => {
    const color = settings.giro.colors[status]
    return { color, bg: hexToRgba(color, 0.12) }
  }

  const classifyCoverage = (coverageDays: number): CoverageStatus => {
    const { criticoMaxDays, atencaoMaxDays, saudavelMaxDays } = settings.coverage.thresholds
    if (coverageDays <= criticoMaxDays) return { label: 'Crítico', color: settings.coverage.colors['Crítico'] }
    if (coverageDays <= atencaoMaxDays) return { label: 'Atenção', color: settings.coverage.colors['Atenção'] }
    if (coverageDays <= saudavelMaxDays) return { label: 'Saudável', color: settings.coverage.colors['Saudável'] }
    return { label: 'Excesso', color: settings.coverage.colors['Excesso'] }
  }

  const coverageColorFor = (label: CoverageLabel) => {
    const color = settings.coverage.colors[label]
    return { color, bg: hexToRgba(color, 0.12) }
  }

  return (
    <InventorySettingsContext.Provider
      value={{ settings, setSettings, resetSettings, classifyGiro, giroColorFor, classifyCoverage, coverageColorFor }}
    >
      {children}
    </InventorySettingsContext.Provider>
  )
}

export function useInventorySettings(): InventorySettingsContextValue {
  const ctx = useContext(InventorySettingsContext)
  if (!ctx) throw new Error('useInventorySettings must be used within an InventorySettingsProvider')
  return ctx
}
