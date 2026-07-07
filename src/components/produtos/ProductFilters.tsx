import { Search, ChevronDown } from 'lucide-react'
import { productCategories } from '@/data/mockData'

const marketplaces = ['Todos os marketplaces', 'Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']
const periods = ['Últimos 30 dias', 'Últimos 7 dias', 'Este mês', 'Últimos 90 dias', 'Este ano']

function Select({ options }: { options: readonly string[] }) {
  return (
    <div className="relative">
      <select className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-border-subtle bg-bg-card/60 pl-3.5 pr-9 text-sm text-text-secondary outline-none transition-colors hover:border-border-default focus:border-accent-blue/50">
        {options.map((o) => (
          <option key={o} value={o} className="bg-bg-secondary text-text-primary">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  )
}

export default function ProductFilters() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_180px]">
        <div className="group flex h-11 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 transition-colors focus-within:border-accent-blue/50 focus-within:bg-bg-card">
          <Search className="h-4 w-4 shrink-0 text-text-muted transition-colors group-focus-within:text-accent-blue" />
          <input
            type="text"
            placeholder="Buscar por produto, SKU ou categoria..."
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <Select options={marketplaces} />
        <Select options={['Todas as categorias', ...productCategories]} />
        <Select options={periods} />
      </div>
    </div>
  )
}
