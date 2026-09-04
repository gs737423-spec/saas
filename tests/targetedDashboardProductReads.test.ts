import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('leituras estreitas de Relatórios e Produto 360', () => {
  it('não usa mais a leitura integral de produtos nesses consumidores', async () => {
    const [reports, detail] = await Promise.all([
      readFile(new URL('../src/pages/Relatorios.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/pages/ProdutoDetalhe.tsx', import.meta.url), 'utf8'),
    ])

    expect(reports).toContain('view=report')
    expect(detail).toContain("params.set('lookup', '1')")
    expect(reports).not.toContain('DashboardProductsResponse')
    expect(detail).not.toContain('`/api/dashboard/products?${period.query}`')
  })

  it('mantém os novos modos isolados no tenant e restritos ao service role', async () => {
    const [api, migration] = await Promise.all([
      readFile(new URL('../api/dashboard/products.ts', import.meta.url), 'utf8'),
      readFile(new URL('../supabase/migrations/031_targeted_dashboard_product_reads.sql', import.meta.url), 'utf8'),
    ])

    expect(api).toContain("requireCompany(req, res)")
    expect(api).toContain("rpc('dashboard_report_products'")
    expect(api).toContain("rpc('dashboard_product_lookup'")
    expect(migration).toContain('create or replace function public.dashboard_report_products')
    expect(migration).toContain('create or replace function public.dashboard_product_lookup')
    expect(migration).toContain('to service_role')
  })
})
