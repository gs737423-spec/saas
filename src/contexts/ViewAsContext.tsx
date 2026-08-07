import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'mkt_view_as'

interface ViewAsState {
  companyId: string
  companyName: string
}

interface ViewAsValue {
  viewAs: ViewAsState | null
  enterViewAs: (companyId: string, companyName: string) => void
  exitViewAs: () => void
}

const ViewAsContext = createContext<ViewAsValue | null>(null)

function readInitial(): ViewAsState | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ViewAsState
  } catch {
    return null
  }
}

// "Acessar Painel do Lojista" — admin visualiza o dashboard real de um
// cliente específico (pra consultoria em call), sempre read-only. O
// backend já autoriza isso: requireCompany.ts deixa platform_admin passar
// ?company_id= explícito em qualquer GET de leitura (ver migration 005 +
// requireCompany.ts) — aqui só guardamos QUAL empresa e anexamos esse
// query param em toda chamada de leitura via apiFetch.ts. Nunca usado em
// endpoint de escrita (POST/PATCH/DELETE continuam exigindo membership
// real do próprio admin, que não existe pra empresa de terceiro).
export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAs] = useState<ViewAsState | null>(readInitial)

  const enterViewAs = useCallback((companyId: string, companyName: string) => {
    const next = { companyId, companyName }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setViewAs(next)
  }, [])

  const exitViewAs = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setViewAs(null)
  }, [])

  return (
    <ViewAsContext.Provider value={{ viewAs, enterViewAs, exitViewAs }}>
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext)
  if (!ctx) throw new Error('useViewAs precisa estar dentro de <ViewAsProvider>')
  return ctx
}

/** Leitura síncrona fora de componente React — usada por apiFetch.ts. */
export function getViewAsCompanyId(): string | null {
  return readInitial()?.companyId ?? null
}
