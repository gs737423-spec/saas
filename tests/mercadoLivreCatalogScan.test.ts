import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('Mercado Livre large catalog scan', () => {
  const source = readFileSync(new URL('../src/server/integrations/mercadolivre/client.ts', import.meta.url), 'utf8')

  it('uses scan pagination instead of unsupported deep offsets', () => {
    expect(source).toContain('search_type=scan')
    expect(source).toContain('scroll_id=')
    expect(source).not.toContain('items/search?offset=')
  })
})
