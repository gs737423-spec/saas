export const UNCATEGORISED_KEY = 'uncategorised'
export const UNCATEGORISED_LABEL = 'Sem categoria'

export interface CategorySourceItem {
  id: string
  name: string
  sku: string | null
  marketplace: string
  categoryId?: string | null
  categoryName?: string | null
  revenue: number
  units: number | null
  stock: number | null
}

export interface CategoryOption {
  key: string
  label: string
}

export interface CategoryMetrics extends CategoryOption {
  products: CategorySourceItem[]
  productCount: number
  revenue: number
  units: number
  /** null quando ao menos um produto da categoria não possui saldo conhecido. */
  stock: number | null
}

export function categoryLabel(item: Pick<CategorySourceItem, 'categoryName'>): string {
  const value = item.categoryName?.trim()
  return value || UNCATEGORISED_LABEL
}

export function categoryKey(item: Pick<CategorySourceItem, 'categoryId' | 'categoryName'>): string {
  const id = item.categoryId?.trim()
  if (id) return `id:${id}`
  const label = item.categoryName?.trim()
  return label ? `name:${label.toLocaleLowerCase('pt-BR')}` : UNCATEGORISED_KEY
}

export function getCategoryOptions(items: CategorySourceItem[]): CategoryOption[] {
  const options = new Map<string, string>()
  for (const item of items) options.set(categoryKey(item), categoryLabel(item))
  return [...options].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function getCategoryProducts(items: CategorySourceItem[], key: string): CategorySourceItem[] {
  return items.filter((item) => categoryKey(item) === key).sort((a, b) => b.revenue - a.revenue)
}

export function matchesCategoryFilter(item: CategorySourceItem, selected: Set<string>): boolean {
  return selected.size === 0 || selected.has(categoryKey(item))
}

export function getCategoryMetrics(items: CategorySourceItem[], key: string): CategoryMetrics | null {
  const products = getCategoryProducts(items, key)
  if (products.length === 0) return null
  return {
    key,
    label: categoryLabel(products[0]),
    products,
    productCount: products.length,
    revenue: products.reduce((sum, item) => sum + item.revenue, 0),
    units: products.reduce((sum, item) => sum + (item.units ?? 0), 0),
    // Um subtotal só é verdadeiro se todos os seus componentes forem
    // conhecidos. Somar `null` como zero reduz artificialmente o estoque.
    stock: products.some((item) => item.stock === null)
      ? null
      : products.reduce((sum, item) => sum + (item.stock ?? 0), 0),
  }
}

export function getTopCategory(items: CategorySourceItem[]): CategoryMetrics | null {
  return getCategoryOptions(items)
    .map((option) => getCategoryMetrics(items, option.key))
    .filter((metrics): metrics is CategoryMetrics => metrics !== null)
    .sort((a, b) => b.revenue - a.revenue || a.label.localeCompare(b.label, 'pt-BR'))[0] ?? null
}
