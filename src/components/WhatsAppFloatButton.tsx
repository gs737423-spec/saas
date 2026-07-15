import { MessageCircle } from 'lucide-react'
import { whatsappDemoUrl } from '@/lib/whatsapp'

// Botão flutuante de WhatsApp — canto inferior direito, presente em todas as
// páginas públicas (site institucional, login). Some por completo se
// VITE_WHATSAPP_NUMBER não estiver configurado (nunca aponta para link vazio
// ou falso). Não abre menu/chatbot — só redireciona para uma conversa real.
export default function WhatsAppFloatButton() {
  const url = whatsappDemoUrl()
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      title="Precisa de ajuda?"
      className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:-translate-y-[3px] hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: 'linear-gradient(155deg, #34D399, #16A34A)',
        boxShadow: '0 12px 30px -8px rgba(34,197,94,0.6), 0 2px 8px rgba(0,0,0,0.3)',
        outlineColor: '#0E8F63',
      }}
    >
      {/* Anel de pulso — único, sutil, para de repetir sozinho (não é loop
          contínuo perceptível: anima uma vez a cada ciclo longo). Respeita
          prefers-reduced-motion via a mesma regra global do site. */}
      <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ animation: 'wa-pulse 3.2s ease-out infinite', background: 'rgba(52,211,153,0.55)' }} />
      <MessageCircle className="relative h-7 w-7" style={{ color: '#fff' }} strokeWidth={2.2} />
      <span className="sr-only">Falar no WhatsApp</span>
    </a>
  )
}
