import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

describe('Produtos e Estoque em catálogos grandes', () => {
  it('persists snapshots por sessão e evita rebaixar as mesmas telas ao voltar de rota', async () => {
    const source = await readFile(new URL('../src/lib/apiFetch.ts', import.meta.url), 'utf8')

    expect(source).toContain("url.startsWith('/api/dashboard/products')")
    expect(source).toContain("url.startsWith('/api/dashboard/inventory')")
  })

  it('não apresenta erro de leitura como marketplace desconectado', async () => {
    const [products, inventory] = await Promise.all([
      readFile(new URL('../src/pages/Produtos.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/pages/Estoque.tsx', import.meta.url), 'utf8'),
    ])

    expect(products).toContain('Não foi possível carregar o catálogo agora')
    expect(inventory).toContain('Não foi possível carregar o estoque agora')
    expect(products).toContain("real?.source === 'error'")
    expect(inventory).toContain("inventory?.source === 'error'")
  })
})
