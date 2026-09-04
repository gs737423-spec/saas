import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('global catalog reads', () => {
  it('keeps alerts limited instead of loading the products endpoint', async () => {
    const source = await readFile(new URL('../src/components/layout/NotificationsMenu.tsx', import.meta.url), 'utf8')
    expect(source).toContain("'/api/dashboard/alerts'")
    expect(source).not.toContain('/api/dashboard/products')
  })

  it('searches products only after a typed term through the lightweight endpoint', async () => {
    const source = await readFile(new URL('../src/components/layout/SearchMenu.tsx', import.meta.url), 'utf8')
    expect(source).toContain('/api/dashboard/product-search?q=')
    expect(source).toContain('term.length < 2')
    expect(source).not.toContain('/api/dashboard/products?days=30')
  })
})
