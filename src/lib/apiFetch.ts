import { supabase } from './supabaseClient'
import { isDemoModeActive } from '@/contexts/DemoModeContext'
import { getViewAsCompanyId } from '@/contexts/ViewAsContext'
import { demoDashboardSummary, demoDashboardProducts, demoDashboardInventory, demoFinanceOverview, demoFinanceTransactions, demoFinanceDaily } from './demoData'

/** "Acessar Painel do Lojista" — só nas leituras de dashboard (GET), nunca
 *  em escrita (POST/PATCH/DELETE seguem exigindo membership real do
 *  próprio usuário, requireCompany.ts não muda isso). O backend já
 *  autoriza platform_admin a passar ?company_id= explícito (migration 005
 *  + requireCompany.ts) — aqui só anexamos o parâmetro quando o modo
 *  "ver como" está ativo. */
function withViewAsCompanyId(url: string, init?: RequestInit): string {
  const method = (init?.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return url
  if (isDemoModeActive()) return url
  if (!url.startsWith('/api/dashboard/')) return url
  const companyId = getViewAsCompanyId()
  if (!companyId) return url
  const withParam = new URL(url, 'http://x')
  withParam.searchParams.set('company_id', companyId)
  return withParam.pathname + withParam.search
}

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
  return fetch(withViewAsCompanyId(url, init), { ...init, headers })
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

  const days = Number(new URL(url, 'http://x').searchParams.get('days')) || 30

  if (url.startsWith('/api/dashboard/summary')) return demoDashboardSummary(days)
  if (url.startsWith('/api/dashboard/products')) return demoDashboardProducts()
  if (url.startsWith('/api/dashboard/inventory')) return demoDashboardInventory()
  if (url.startsWith('/api/dashboard/finance-daily')) {
    return { ok: true, source: 'demo', days: demoFinanceDaily(days + Math.max(days, 30)) }
  }
  if (url.startsWith('/api/dashboard/finance')) {
    // Mesmo days do summary — senão o card do topo (Dashboard/Relatórios)
    // muda com o período e a lista de marketplace (Marketplaces/Financeiro)
    // fica parada, dois números que não batem na mesma sessão de demo.
    const { overview, byMarketplace } = demoFinanceOverview(days)
    return { ok: true, overview, byMarketplace, transactions: demoFinanceTransactions() }
  }
  return null
}

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const demo = demoInterceptFor(url)
  if (demo !== null) return demo as T

  try {
    const res = await apiFetch(url, init)
    if (!res.ok) {
      // Todo chamador trata `null` como "sem dado ainda" (ex: mostra prompt
      // de conectar marketplace) — indistinguível de uma falha real (500,
      // sessão expirada). Log aqui é o mínimo pra não esconder o incidente
      // por completo; distinguir os dois estados na UI de cada página é uma
      // mudança maior, por página, que não cabe nesta correção pontual.
      console.error(`[apiFetchJson] ${res.status} ${url}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.error(`[apiFetchJson] network error ${url}`, err)
    return null
  }
}
