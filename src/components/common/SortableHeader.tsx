import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { SortDir } from '@/lib/useSortedPaginatedRows'

interface Props<K extends string> {
  label: string
  sortKeyValue: K
  activeSortKey: K
  sortDir: SortDir
  onSort: (key: K) => void
  className?: string
}

/** <th> clicável com ícone de ordenação — mesmo padrão visual já usado em
 *  ProductTable.tsx/RealInventoryTable.tsx. */
export default function SortableHeader<K extends string>({ label, sortKeyValue, activeSortKey, sortDir, onSort, className = '' }: Props<K>) {
  const active = activeSortKey === sortKeyValue
  return (
    <th
      className={`group cursor-pointer px-4 py-3 font-semibold select-none transition-colors hover:text-text-secondary ${className}`}
      onClick={() => onSort(sortKeyValue)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-blue" /> : <ArrowDown className="h-3 w-3 text-accent-blue" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </span>
    </th>
  )
}
