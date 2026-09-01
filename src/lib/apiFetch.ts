import { supabase } from './supabaseClient'
import { isDemoModeActive } from '@/contexts/DemoModeContext'
import { getViewAsCompanyId } from '@/contexts/ViewAsContext'
import { demoDashboardSummary, demoDashboardProducts, demoDashboardInventory, demoFinanceOverview, demoFinanceTransactions, demoFinanceDaily } from './demoData'

// GETs que requireCompany.ts aceita com ?company_id= explícito quando quem
// chama é platform_admin — status/logs de integração (Conexões) tanto
// quanto os endpoints de dashboard. Não inclui rotas de escrita/OAuth
// (authorize/sync/callback): "ver como" é sempre leitura, nunca dispara
// ação em nome de outra empresa.
const VIEW_AS_URL_PREFIXES = ['/api/dashboard/', '/api/integrations/status', '/api/integrations/logs']
// Resumos pequenos podem permanecer cinco minutos na sessão; respostas de
// catálogo/estoque nunca entram nesse cache pois uma conta grande não pode
// ocupar memória ou sessionStorage do navegador só para acelerar o retorno.
const DASHBOARD_CACHE_TTL_MS = 5 * 60_000
const DASHBOARD_SESSION_CACHE_PREFIX = 'mktonline:dashboard-cache:'

interface CachedDashboardResponse {
  expiresAt: number
  value: unknown
}

// Cache curto, somente em memória do navegador. A chave inclui usuário e URL
// (que já contém company_id no modo "ver como"), então nenhuma resposta pode
// ser reaproveitada entre sessões ou tenants. Ele evita baixar o mesmo
// snapshot ao alternar entre seções e voltar ao filtro recém-consultado.
const dashboardCache = new Map<string, CachedDashboardResponse>()
const dashboardInFlight = new Map<string, Promise<unknown | null>>()
let dashboardCacheGeneration = 0

function isCacheableDashboardResponse(url: string): boolean {
  return url.startsWith('/api/dashboard/summary')
    || url.startsWith('/api/dashboard/finance-daily')
    || (url.startsWith('/api/dashboard/finance') && url.includes('include_transactions=false'))
}

function readSessionDashboardCache(cacheKey: string): CachedDashboardResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(`${DASHBOARD_SESSION_CACHE_PREFIX}${cacheKey}`)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedDashboardResponse
    if (cached.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(`${DASHBOARD_SESSION_CACHE_PREFIX}${cacheKey}`)
      return null
    }
    return cached
  } catch {
    return null
  }
}

function writeSessionDashboardCache(cacheKey: string, cached: CachedDashboardResponse): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(`${DASHBOARD_SESSION_CACHE_PREFIX}${cacheKey}`, JSON.stringify(cached))
  } catch {
    // Quota/storage desabilitado não pode bloquear leitura operacional.
  }
}

/** "Acessar Painel do Lojista" — só nas leituras de dashboard/integrações
 *  (GET), nunca em escrita (POST/PATCH/DELETE seguem exigindo membership
 *  real do próprio usuário, requireCompany.ts não muda isso). O backend já
 *  autoriza platform_admin a passar ?company_id= explícito (migration 005
 *  + requireCompany.ts) — aqui só anexamos o parâmetro quando o modo
 *  "ver como" está ativo. */
export function withViewAsCompanyId(url: string, init?: RequestInit): string {
  const method = (init?.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return url
  if (isDemoModeActive()) return url
  if (!VIEW_AS_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) return url
  const companyId = getViewAsCompanyId()
  if (!companyId) return url
  const withParam = new URL(url, 'http://x')
  withParam.searchParams.set('company_id', companyId)
  return withParam.pathname + withParam.search
}

export function invalidateDashboardCache(): void {
  dashboardCacheGeneration += 1
  dashboardCache.clear()
  dashboardInFlight.clear()
  if (typeof window !== 'undefined') {
    try {
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index)
        if (key?.startsWith(DASHBOARD_SESSION_CACHE_PREFIX)) window.sessionStorage.removeItem(key)
      }
    } catch {
      // Storage opcional; o cache em memória já foi invalidado.
    }
  }
}

async function authenticatedRequest(url: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    sessionScope: data.session?.user.id ?? 'anonymous',
    requestUrl: withViewAsCompanyId(url, init),
    init: {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    },
  }
}

/** fetch() com o access_token do Supabase Auth no header Authorization —
 *  todo endpoint de api/** que exige sessão (requireUser/requireCompany/
 *  requireAdmin) depende disso. */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const request = await authenticatedRequest(url, init)
  return fetch(request.requestUrl, request.init)
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
    return { ok: true, overview, byMarketplace, transactions: demoFinanceTransactions(), lastSyncAt: new Date().toISOString() }
  }
  return null
}

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const demo = demoInterceptFor(url)
  if (demo !== null) return demo as T

  try {
    const request = await authenticatedRequest(url, init)
    const isCacheableDashboardRead = (init?.method ?? 'GET').toUpperCase() === 'GET'
      && isCacheableDashboardResponse(request.requestUrl)
      && !init?.signal

    const readJson = async (): Promise<T | null> => {
      const res = await fetch(request.requestUrl, request.init)
      if (!res.ok) {
        console.error(`[apiFetchJson] ${res.status} ${url}`)
        return null
      }
      return (await res.json()) as T
    }

    if (!isCacheableDashboardRead) return readJson()

    const cacheKey = `${request.sessionScope}:${request.requestUrl}`
    const cached = dashboardCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value as T
    const persisted = readSessionDashboardCache(cacheKey)
    if (persisted) {
      dashboardCache.set(cacheKey, persisted)
      return persisted.value as T
    }

    const pending = dashboardInFlight.get(cacheKey)
    if (pending) return (await pending) as T | null

    const generation = dashboardCacheGeneration
    const pendingRequest = readJson().then((value) => {
      if (value !== null && generation === dashboardCacheGeneration) {
        const cached = { value, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS }
        dashboardCache.set(cacheKey, cached)
        writeSessionDashboardCache(cacheKey, cached)
      }
      return value
    }).finally(() => {
      dashboardInFlight.delete(cacheKey)
    })
    dashboardInFlight.set(cacheKey, pendingRequest)
    return (await pendingRequest) as T | null
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null
    console.error(`[apiFetchJson] network error ${url}`, err)
    return null
  }
}
