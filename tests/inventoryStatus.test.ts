import { describe, expect, it } from 'vitest'
import { coveragePresentation, giroPresentation } from '../src/lib/inventoryStatus'

describe('coverage presentation', () => {
  it.each([
    [1, 'Baixa', 'danger'],
    [14.9, 'Baixa', 'danger'],
    [15, 'Saudável', 'good'],
    [17, 'Saudável', 'good'],
    [44.9, 'Saudável', 'good'],
    [45, 'Excesso', 'danger'],
  ] as const)('maps %s days to %s', (days, label, tone) => {
    expect(coveragePresentation(days)).toMatchObject({ label, tone })
  })
})

describe('giro presentation', () => {
  it.each([
    [5, 'Alto', 'good'],
    [10, 'Normal', 'neutral'],
    [25, 'Baixo', 'danger'],
    [45, 'Parado', 'danger'],
  ] as const)('maps %s coverage days to %s', (days, label, tone) => {
    expect(giroPresentation(1, 1, days)).toMatchObject({ label, tone })
  })

  it('treats stock without sales as stopped and dangerous', () => {
    expect(giroPresentation(0, 10, null)).toMatchObject({ label: 'Parado crítico', tone: 'danger' })
  })
})
