import { describe, expect, it } from 'vitest'
import { getMarketplaceGrowthPresentation } from '../src/lib/marketplaceGrowth'

describe('marketplace growth presentation', () => {
  it('never labels a negative comparison as growth', () => {
    expect(getMarketplaceGrowthPresentation({ d1: -100, d7: -40, d30: null, d365: null })).toEqual({ status: 'down', label: 'Em queda' })
  })

  it('uses the weekly comparison before the noisier daily value', () => {
    expect(getMarketplaceGrowthPresentation({ d1: 80, d7: -4, d30: 30, d365: null })).toEqual({ status: 'down', label: 'Em queda' })
  })

  it('does not invent a trend when no comparison has a valid baseline', () => {
    expect(getMarketplaceGrowthPresentation({ d1: null, d7: null, d30: null, d365: null })).toEqual({ status: 'unavailable', label: 'Sem base' })
  })
})
