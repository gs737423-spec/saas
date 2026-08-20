import { ArrowRight } from 'lucide-react'
import { whatsappDemoUrl } from '@/lib/whatsapp'

/**
 * Ação comercial do login — "Ainda não é cliente? Solicitar demonstração".
 * NÃO é cadastro público: leva ao fluxo comercial já existente
 * (`whatsappDemoUrl()`). Se o WhatsApp não estiver configurado, o link seria
 * falso — então o bloco inteiro se oculta (nunca aponta para destino vazio).
 */
export default function LoginCommercialAction() {
  const demoUrl = whatsappDemoUrl()
  if (!demoUrl) return null

  return (
    <div className="login-commercial">
      <span className="login-commercial__text">Ainda não é cliente?</span>
      <a
        href={demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="login-commercial__cta"
      >
        Solicitar uma demonstração
        <ArrowRight className="login-commercial__arrow h-4 w-4" />
      </a>
    </div>
  )
}
