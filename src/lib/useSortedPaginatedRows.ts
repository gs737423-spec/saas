import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

/** Ordena + pagina uma lista de linhas (10/página) — mesmo padrão de
 *  ordenação já usado em ProductTable.tsx/RealInventoryTable.tsx, extraído
 *  pra reutilizar em tabelas admin (Clientes, Solicitações). Reseta pra
 *  página 1 sempre que a lista de entrada muda de tamanho (nova busca/
 *  filtro), senão o usuário fica preso numa página vazia. */
export function useSortedPaginatedRows<T, K extends string>(
  rows: T[],
  compareFns: Record<K, (a: T, b: T) => number>,
  defaultSortKey: K,
  pageSize = 10
) {
  const [sortKey, setSortKey] = useState<K>(defaultSortKey)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  function handleSort(key: K) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const sorted = useMemo(() => {
    const cmp = compareFns[sortKey]
    const out = [...rows].sort(cmp)
    return sortDir === 'asc' ? out : out.reverse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  return { sortKey, sortDir, handleSort, page: safePage, setPage, totalPages, pageRows, totalRows: sorted.length }
}
