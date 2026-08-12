import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'mktonline-theme'

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  // Sem preferência salva: plataforma nasceu dark-first, então esse
  // continua sendo o padrão — só respeita o SO se ele pedir claro
  // explicitamente (evita herdar "dark" do SO redundantemente).
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

// Aplica via atributo em <html> (`data-theme`) — os tokens de cor em
// index.css (`:root[data-theme="light"] { ... }`) sobrescrevem as
// variáveis do modo escuro por especificidade de seletor, sem duplicar
// nenhuma classe Tailwind existente. Site institucional (namespace
// --vintec-*) não é afetado.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
