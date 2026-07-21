import { Link } from 'react-router-dom'
import { MessageCircle, Lock } from 'lucide-react'
import { contact, marketplaces, specialistHref } from '@/site/content'
import { whatsappDemoUrl } from '@/lib/whatsapp'

// Footer compacto — 5 colunas, ink-950 flat. Sem CTA duplicado (a conversão
// já está unificada em ConversionSection, logo acima).
export default function Footer() {
  const year = new Date().getFullYear()
  const wa = whatsappDemoUrl()
  const specialist = specialistHref()

  return (
    <footer id="privacidade-anchor" className="sec-footer-flat" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="site-container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="max-w-[220px] sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-extrabold" style={{ color: '#EAF4F3' }}>Vintec</span>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: 'rgba(214,235,232,0.65)', lineHeight: 1.55 }}>
              A Vintec ajuda empresas que vendem em vários marketplaces a reunir informações e acompanhar a rotina com menos controles paralelos.
            </p>
          </div>

          <nav aria-label="Rodapé — navegação">
            <h2 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#78CAFF' }}>Navegação</h2>
            <ul className="mt-3.5 space-y-2">
              <li><a href="#servicos" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Soluções</a></li>
              <li><a href="#como-funciona" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Como funciona</a></li>
              <li><a href="#diferenciais" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Por que Vintec</a></li>
            </ul>
          </nav>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#78CAFF' }}>Marketplaces</h2>
            <ul className="mt-3.5 space-y-2">
              {marketplaces.map((m) => (
                <li key={m.name} className="text-[13.5px]" style={{ color: 'rgba(234,244,243,0.82)' }}>{m.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#78CAFF' }}>Institucional</h2>
            <ul className="mt-3.5 space-y-2">
              <li><a href="#sobre" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Quem somos</a></li>
              <li><a href="#faq" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>FAQ</a></li>
              <li><a href="#conversao" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Contato</a></li>
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#78CAFF' }}>Acesso</h2>
            <ul className="mt-3.5 space-y-2">
              <li><Link to="/login" className="inline-flex items-center gap-1.5 text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}><Lock className="h-3.5 w-3.5" /> Entrar</Link></li>
              {wa && (
                <li><a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13.5px]" style={{ color: '#78CAFF' }}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a></li>
              )}
              {contact.email && (
                <li><a href={`mailto:${contact.email}`} className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>{contact.email}</a></li>
              )}
              <li><a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-[13.5px] hover:underline" style={{ color: '#EAF4F3' }}>Fale com um especialista</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="text-[12px] hover:underline" style={{ color: 'rgba(214,235,232,0.65)' }}>Política de Privacidade</Link>
            <Link to="/termos" className="text-[12px] hover:underline" style={{ color: 'rgba(214,235,232,0.65)' }}>Termos de Uso</Link>
          </div>
          <p className="text-[12px]" style={{ color: 'rgba(214,235,232,0.55)' }}>&copy; {year} Vintec. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
