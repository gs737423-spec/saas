import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Package } from 'lucide-react'
import { LayoutDashboard, Store, Boxes, Wallet, Link2, FileBarChart2, Settings } from 'lucide-react'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'

const pages = [
  { icon: LayoutDashboard, label: 'Visão Geral', to: '/app' },
  { icon: Store, label: 'Marketplaces', to: '/app/marketplaces' },
  { icon: Package, label: 'Produtos', to: '/app/produtos' },
  { icon: Boxes, label: 'Estoque', to: '/app/estoque' },
  { icon: Wallet, label: 'Financeiro', to: '/app/financeiro' },
  { icon: Link2, label: 'Conexões', to: '/app/importacoes' },
  { icon: FileBarChart2, label: 'Relatórios', to: '/app/relatorios' },
  { icon: Settings, label: 'Configurações', to: '/app/configuracoes' },
]

export default function SearchMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQuery('')
  }, [open])

  // Busca produto real (não mock) quando a empresa tem marketplace
  // sincronizado — carrega só na primeira vez que o usuário abre a busca.
  useEffect(() => {
    if (!open || real) return
    apiFetchJson<DashboardProductsResponse>('/api/dashboard/products?days=30').then(setReal)
  }, [open, real])

  const q = query.trim().toLowerCase()

  // Sem conexão/sync ainda, busca de produto fica vazia — nunca mock.
  const searchableProducts: Pick<DashboardProduct, 'id' | 'sku' | 'name'>[] = real?.source === 'real' ? real.items : []

  const matchedPages = useMemo(
    () => (q ? pages.filter((p) => p.label.toLowerCase().includes(q)) : pages),
    [q]
  )
  const matchedProducts = useMemo(
    () =>
      q
        ? searchableProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)).slice(0, 6)
        : [],
    [q, searchableProducts]
  )

  function go(to: string) {
    navigate(to)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        title="Buscar"
        onClick={() => setOpen((o) => !o)}
        className="motion-header-control flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted hover:text-text-primary"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="Buscar páginas, produtos, SKU..."
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            {query && (
              <button onClick={() => setQuery('')} className="cursor-pointer text-text-muted hover:text-text-primary">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto py-1.5">
            {matchedPages.length > 0 && (
              <div className="px-1.5">
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Páginas</p>
                {matchedPages.map((p) => (
                  <button
                    key={p.to}
                    onClick={() => go(p.to)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                  >
                    <p.icon className="h-4 w-4 text-text-muted" />
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {matchedProducts.length > 0 && (
              <div className="mt-1 border-t border-border-subtle px-1.5 pt-1.5">
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Produtos</p>
                {matchedProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => go(`/app/produto/${p.sku ?? p.id}`)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <Package className="h-4 w-4 shrink-0 text-text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-text-primary">{p.name}</span>
                      <span className="block truncate font-mono text-[10px] text-text-muted">{p.sku ?? p.id}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {q && matchedPages.length === 0 && matchedProducts.length === 0 && (
              <p className="px-4 py-6 text-center text-[12.5px] text-text-muted">Nada encontrado para "{query}".</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
