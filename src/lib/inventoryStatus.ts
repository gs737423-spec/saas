export type InventoryTone = 'good' | 'danger' | 'neutral'

export interface InventoryStatusPresentation<TLabel extends string> {
  label: TLabel
  tone: InventoryTone
  color: string
  background: string
}

export type CoveragePresentationLabel = 'Baixa' | 'Excesso' | 'Saudável' | 'Sem venda'
export type GiroPresentationLabel = 'Alto' | 'Normal' | 'Baixo' | 'Parado' | 'Parado crítico'

const PRESENTATION = {
  good: { color: 'var(--status-good-text)', background: 'var(--status-good-bg)' },
  danger: { color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)' },
  neutral: { color: 'var(--status-neutral-text)', background: 'var(--status-neutral-bg)' },
} as const

function status<TLabel extends string>(label: TLabel, tone: InventoryTone): InventoryStatusPresentation<TLabel> {
  return { label, tone, ...PRESENTATION[tone] }
}

// Mantém os thresholds operacionais existentes. Esta função traduz somente
// a apresentação: verde = faixa boa; vermelho = risco ou capital parado.
export function coveragePresentation(coverageDays: number | null): InventoryStatusPresentation<CoveragePresentationLabel> {
  if (coverageDays === null) return status('Sem venda', 'neutral')
  if (coverageDays < 15) return status('Baixa', 'danger')
  if (coverageDays < 45) return status('Saudável', 'good')
  return status('Excesso', 'danger')
}

export function giroPresentation(
  soldQuantity: number | null | undefined,
  availableQuantity: number,
  coverageDays: number | null,
): InventoryStatusPresentation<GiroPresentationLabel> {
  if (!soldQuantity || soldQuantity <= 0) {
    return status(availableQuantity > 0 ? 'Parado crítico' : 'Parado', 'danger')
  }
  if (coverageDays === null) return status('Normal', 'neutral')
  if (coverageDays < 7) return status('Alto', 'good')
  if (coverageDays < 20) return status('Normal', 'neutral')
  if (coverageDays < 45) return status('Baixo', 'danger')
  return status('Parado', 'danger')
}
