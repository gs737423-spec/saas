import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('analytics reais e freshness rastreável', () => {
  it('produto usa order_items por data e mantém série sintética apenas no demo explícito', async () => {
    const [endpoint, chart] = await Promise.all([
      readFile(new URL('../api/dashboard/product-sales.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/produto-detalhe/SalesTrendChart.tsx', import.meta.url), 'utf8'),
    ])

    expect(endpoint).toContain(".from('order_items')")
    expect(endpoint).toContain(".eq('orders.status', 'paid')")
    expect(endpoint).toContain(".eq('orders.analytics_included', true)")
    expect(endpoint).toContain(".eq('company_id', auth.companyId)")
    expect(chart).toContain("source === 'demo' ? demoPoints")
    expect(chart).toContain('Vendas reais por data no período')
    expect(chart).toContain('Nenhuma venda paga deste produto foi encontrada no período.')
    expect(chart).not.toContain('distribuição por dia estimada')
  })

  it('financeiro expõe timestamp do backend e não usa freshness fixa', async () => {
    const [endpoint, page] = await Promise.all([
      readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/pages/Financeiro.tsx', import.meta.url), 'utf8'),
    ])

    expect(endpoint).toContain(".select('id, provider, status, last_sync_at')")
    expect(endpoint).toContain('lastSyncAt')
    expect(page).toContain('response.lastSyncAt')
    expect(page).toContain('dados demonstrativos')
    expect(page).not.toContain('há poucos minutos')
  })
})
