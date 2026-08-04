import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const IDLE_LIMIT_MS = 30 * 60 * 1000

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

// Deslogar por inatividade é padrão em SaaS corporativo/bancário, mas o
// Supabase só oferece isso nativamente (revogação real de sessão no
// servidor) no plano Pro. Este hook é a versão client-side: menos robusta
// (um usuário mal-intencionado com acesso ao console pode burlar o timer),
// mas resolve a experiência sem custo — sessão nunca mais fica "esquecida"
// aberta indefinidamente numa aba parada.
export function useIdleLogout() {
  const { signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    function reset() {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(async () => {
        await signOut()
        navigate('/login', { replace: true })
      }, IDLE_LIMIT_MS)
    }

    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }))

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [isAuthenticated, signOut, navigate])
}
