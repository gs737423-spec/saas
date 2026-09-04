import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('catálogo paginado no servidor', () => {
  it('mantém as telas pesadas no contrato paginado e não migra consumidores legados à força', async () => {
    const [productsPage, inventoryPage, productsApi, inventoryApi] = await Promise.all([
      readFile(new URL('../src/pages/Produtos.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/pages/Estoque.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/products.ts', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/inventory.ts', import.meta.url), 'utf8'),
    ])

    expect(productsPage).toContain("params.set('page'")
    expect(inventoryPage).toContain("page: String(query.page)")
    expect(productsApi).toContain("rpc('dashboard_products_page'")
    expect(inventoryApi).toContain("rpc('dashboard_inventory_page'")
    expect(productsApi).toContain('if (queryValue(req.query.page))')
    expect(inventoryApi).toContain('if (queryValue(req.query.page))')
  })

  it('declara funções de leitura restritas ao service role na migration', async () => {
    const migration = await readFile(new URL('../supabase/migrations/030_paged_catalog_dashboard_reads.sql', import.meta.url), 'utf8')
    expect(migration).toContain('create or replace function public.dashboard_products_page')
    expect(migration).toContain('create or replace function public.dashboard_inventory_page')
    expect(migration).toContain('grant execute on function public.dashboard_products_page')
    expect(migration).toContain('grant execute on function public.dashboard_inventory_page')
    expect(migration).toContain('to service_role')
  })
})
