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
      className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: '#22C55E',
        boxShadow: '0 10px 26px -6px rgba(34,197,94,0.55), 0 2px 6px rgba(0,0,0,0.25)',
        outlineColor: '#0E8F63',
      }}
    >
      <MessageCircle className="h-7 w-7" style={{ color: '#fff' }} strokeWidth={2.2} />
      <span className="sr-only">Falar no WhatsApp</span>
    </a>
  )
}
