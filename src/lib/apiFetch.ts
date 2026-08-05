import { supabase } from './supabaseClient'
import { isDemoModeActive } from '@/contexts/DemoModeContext'
import { demoDashboardSummary, demoDashboardProducts, demoDashboardInventory, demoFinanceOverview, demoFinanceTransactions } from './demoData'

/** fetch() com o access_token do Supabase Auth no header Authorization —
 *  todo endpoint de api/** que exige sessão (requireUser/requireCompany/
 *  requireAdmin) depende disso. */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  }
  return fetch(url, { ...init, headers })
}

// Modo Demonstração — intercepta só os 4 endpoints de leitura do dashboard
// cliente (GET, sempre) e devolve payload ilustrativo com `source: 'demo'`
// (shape idêntico ao real, o contrato de tipos já previa esse valor). Nunca
// intercepta escrita nem rotas de admin/integrações — só o que a Visão
// Geral/Marketplaces/Produtos/Estoque/Financeiro do cliente leem pra montar
// tela. Ver src/lib/demoData.ts.
function demoInterceptFor(url: string): unknown | null {
  if (!isDemoModeActive()) return null
  if (!url.startsWith('/api/dashboard/')) return null

  if (url.startsWith('/api/dashboard/summary')) return demoDashboardSummary()
  if (url.startsWith('/api/dashboard/products')) return demoDashboardProducts()
  if (url.startsWith('/api/dashboard/inventory')) return demoDashboardInventory()
  if (url.startsWith('/api/dashboard/finance')) {
    const { overview, byMarketplace } = demoFinanceOverview()
    return { ok: true, overview, byMarketplace, transactions: demoFinanceTransactions() }
  }
  return null
}

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const demo = demoInterceptFor(url)
  if (demo !== null) return demo as T

  try {
    const res = await apiFetch(url, init)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
