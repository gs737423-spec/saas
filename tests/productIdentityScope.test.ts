import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('product mutations are connection-scoped', () => {
  it('requires connectionId in the API and scopes the cost update by it', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../api/dashboard/products.ts'), 'utf-8')
    expect(source).toContain('connectionId e externalProductId são obrigatórios')
    expect(source).toMatch(/update\(\{ cost_price: costPrice \}\)[\s\S]{0,300}\.eq\('company_id',[\s\S]{0,200}\.eq\('connection_id', connectionId\)[\s\S]{0,200}\.eq\('external_product_id', externalProductId\)/)
  })

  it('updates only the matching connection in local UI state', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../src/pages/Produtos.tsx'), 'utf-8')
    expect(source).toContain('connectionId: product.connectionId')
    expect(source).toContain('p.connectionId === product.connectionId')
  })
})
