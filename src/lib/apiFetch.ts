import { supabase } from './supabaseClient'

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

export async function apiFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await apiFetch(url, init)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
