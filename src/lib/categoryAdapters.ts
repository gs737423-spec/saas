import type { DashboardProduct } from '@/server/dashboardProducts'
import type { DashboardInventoryItem } from '@/server/integrations/types'
import type { CategorySourceItem } from './categoryAnalytics'

export function categoryItemFromProduct(product: DashboardProduct): CategorySourceItem {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    marketplace: product.marketplace,
    categoryId: product.categoryId,
    categoryName: product.category,
    revenue: product.revenue,
    units: product.units,
    stock: product.stock,
  }
}

export function categoryItemFromInventory(item: DashboardInventoryItem): CategorySourceItem {
  return {
    id: item.sku ?? `${item.marketplace}:${item.title}`,
    name: item.title,
    sku: item.sku,
    marketplace: item.marketplace,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    revenue: item.revenue30d,
    units: item.soldQuantity,
    // `null` significa que a integração não informou saldo. Mantê-lo evita
    // que a categoria apresente uma soma de estoque inventada.
    stock: item.availableQuantity,
  }
}
