import { useParams, Link } from 'react-router-dom'
import { products, stockItems, getProductStatus, getProductHealthScore } from '@/data/mockData'
import ProdutoHeader from '@/components/produto-detalhe/ProdutoHeader'
import ProdutoKPIs from '@/components/produto-detalhe/ProdutoKPIs'
import SalesTrendChart from '@/components/produto-detalhe/SalesTrendChart'
import ProdutoHealthScore from '@/components/produto-detalhe/ProdutoHealthScore'
import MarketplacePerformanceBreakdown from '@/components/produto-detalhe/MarketplacePerformanceBreakdown'
import ProdutoAtividade from '@/components/produto-detalhe/ProdutoAtividade'

export default function ProdutoDetalhe() {
  const { sku } = useParams<{ sku: string }>()
  const product = products.find((p) => p.sku === sku)

  if (!product) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <p className="text-sm font-medium text-text-primary">Produto não encontrado</p>
        <p className="mt-1 text-[13px] text-text-muted">Nenhum produto com o SKU "{sku}" foi encontrado.</p>
        <Link to="/produtos" className="mt-4 inline-block rounded-lg bg-accent-blue/10 px-4 py-2 text-[13px] font-medium text-accent-blue hover:bg-accent-blue/20">
          Voltar para Produtos
        </Link>
      </div>
    )
  }

  const stock = stockItems.find((s) => s.sku === product.sku)
  const status = getProductStatus(product.sku)
  const health = getProductHealthScore(product, stock, status)

  return (
    <div className="space-y-3 sm:space-y-4">
      <ProdutoHeader product={product} status={status} stock={stock} />
      <ProdutoKPIs product={product} stock={stock} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SalesTrendChart sku={product.sku} />
        <ProdutoHealthScore health={health} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MarketplacePerformanceBreakdown product={product} />
        <ProdutoAtividade sku={product.sku} />
      </div>
    </div>
  )
}
