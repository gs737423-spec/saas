import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { TurnoverStatus } from '@/data/mockData'

export interface TurnoverThresholds {
  /** Giro (vendas ÷ estoque médio) mínimo para cada faixa — ordem decrescente. */
  normalMin: number
  lentoMin: number
  paradoMin: number
}

export interface TurnoverColors {
  Normal: string
  Lento: string
  Parado: string
  'Parado crítico': string
}

export interface InventorySettings {
  thresholds: TurnoverThresholds
  colors: TurnoverColors
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  thresholds: { normalMin: 2.5, lentoMin: 1.5, paradoMin: 0.8 },
  colors: {
    Normal: '#16C784',
    Lento: '#F5A524',
    Parado: '#9061F9',
    'Parado crítico': '#8B2942',
  },
}

const STORAGE_KEY = 'acelera_inventory_settings'

interface InventorySettingsContextValue {
  settings: InventorySettings
  setSettings: (next: InventorySettings) => void
  resetSettings: () => void
  classifyTurnover: (turnover: number) => TurnoverStatus
  colorFor: (status: TurnoverStatus) => { color: string; bg: string }
}

const InventorySettingsContext = createContext<InventorySettingsContextValue | null>(null)

function loadStored(): InventorySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_INVENTORY_SETTINGS
    const parsed = JSON.parse(raw) as InventorySettings
    return {
      thresholds: { ...DEFAULT_INVENTORY_SETTINGS.thresholds, ...parsed.thresholds },
      colors: { ...DEFAULT_INVENTORY_SETTINGS.colors, ...parsed.colors },
    }
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
// "stalled" inventory — and its colors — instead of a hardcoded scale.
// Persisted client-side (per browser) via localStorage.
export function InventorySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<InventorySettings>(loadStored)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setSettings = (next: InventorySettings) => setSettingsState(next)
  const resetSettings = () => setSettingsState(DEFAULT_INVENTORY_SETTINGS)

  const classifyTurnover = (turnover: number): TurnoverStatus => {
    const { normalMin, lentoMin, paradoMin } = settings.thresholds
    if (turnover >= normalMin) return 'Normal'
    if (turnover >= lentoMin) return 'Lento'
    if (turnover >= paradoMin) return 'Parado'
    return 'Parado crítico'
  }

  const colorFor = (status: TurnoverStatus) => {
    const color = settings.colors[status]
    return { color, bg: hexToRgba(color, 0.12) }
  }

  return (
    <InventorySettingsContext.Provider value={{ settings, setSettings, resetSettings, classifyTurnover, colorFor }}>
      {children}
    </InventorySettingsContext.Provider>
  )
}

export function useInventorySettings(): InventorySettingsContextValue {
  const ctx = useContext(InventorySettingsContext)
  if (!ctx) throw new Error('useInventorySettings must be used within an InventorySettingsProvider')
  return ctx
}
