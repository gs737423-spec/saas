import { useEffect, useState } from 'react'
import { apiFetchJson } from '@/lib/apiFetch'

/** Quantidade real de solicitações pendentes (tabela `leads`, ver migration
 *  013) — usado no badge da nav e no banner do painel admin. Nunca mais
 *  fixo: se não vier nada (endpoint indisponível/tabela ainda não migrada),
 *  fica 0 em vez de mostrar um número congelado. */
export function useLeadsCount(enabled = true): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    apiFetchJson<{ ok: boolean; leads: unknown[] }>('/api/admin/leads').then((res) => {
      if (!cancelled) setCount(res?.leads?.length ?? 0)
    })
    return () => { cancelled = true }
  }, [enabled])

  return count
}
