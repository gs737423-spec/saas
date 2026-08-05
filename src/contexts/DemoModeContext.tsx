import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'mkt_demo_mode'

interface DemoModeValue {
  demoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeValue | null>(null)

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(STORAGE_KEY) === '1'
}

// Modo Demonstração — só troca a FONTE dos dados que a UI já sabia exibir
// (todo endpoint /api/dashboard/* já tinha `source: 'demo'` no contrato de
// tipos, ver src/server/integrations/types.ts). Nunca escreve, nunca chama
// endpoint de escrita — é puramente um flag de leitura, lido por apiFetch.ts
// pra devolver payload ilustrativo em vez de bater no Supabase real.
export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = useState(readInitial)

  const enterDemoMode = useCallback(() => {
    window.sessionStorage.setItem(STORAGE_KEY, '1')
    setDemoModeState(true)
  }, [])

  const exitDemoMode = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setDemoModeState(false)
  }, [])

  return (
    <DemoModeContext.Provider value={{ demoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext)
  if (!ctx) throw new Error('useDemoMode precisa estar dentro de <DemoModeProvider>')
  return ctx
}

/** Leitura síncrona fora de componente React — usada por apiFetch.ts, que
 *  não é um hook e roda antes de qualquer render. */
export function isDemoModeActive(): boolean {
  return readInitial()
}
