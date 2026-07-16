import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import mark from '@/assets/acelera-mark.png'
import { nav, contact, marketplaces, specialistHref } from '@/site/content'
import { whatsappDemoUrl } from '@/lib/whatsapp'

export default function Footer() {
  const year = new Date().getFullYear()
  const wa = whatsappDemoUrl()
  const specialist = specialistHref()

  return (
    <footer id="privacidade-anchor" className="site-dark" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="site-container py-14">
        {/* Faixa de CTA */}
        <div className="vt-card mb-12 flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight vt-ink md:text-[24px]">Pronto para organizar sua operação multicanal?</h2>
            <p className="mt-1.5 text-[14px] vt-muted">Fale com um especialista e entenda como a Vintec pode apoiar seus canais.</p>
          </div>
          <a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="btn btn-primary shrink-0" style={{ padding: '0.85rem 1.5rem' }}>
            Fale com um especialista <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca + descrição + marketplaces */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src={mark} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-[16px] font-extrabold vt-ink">Vintec</span>
            </div>
            <p className="mt-4 text-[13.5px] vt-muted" style={{ lineHeight: 1.6 }}>
              Plataforma de gestão de operações multicanal. Conecta seus canais por API e centraliza a operação em uma visão só.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {marketplaces.map((m) => (
                <span key={m.name} title={m.name} className="flex h-8 w-8 items-center justify-center">
                  <m.Logo />
                </span>
              ))}
            </div>
          </div>

          {/* Navegação */}
          <nav aria-label="Rodapé — navegação">
            <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#4FD9C9' }}>Navegação</h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}><a href={n.href} className="text-[14px] vt-ink hover:underline">{n.label}</a></li>
              ))}
              <li><Link to="/login" className="text-[14px] vt-ink hover:underline">Entrar</Link></li>
            </ul>
          </nav>

          {/* Institucional + contato */}
          <div>
            <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#4FD9C9' }}>Institucional</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/privacidade" className="text-[14px] vt-ink hover:underline">Política de Privacidade</Link></li>
              <li><Link to="/termos" className="text-[14px] vt-ink hover:underline">Termos de Uso</Link></li>
              {contact.email && (
                <li><a href={`mailto:${contact.email}`} className="text-[14px] vt-ink hover:underline">{contact.email}</a></li>
              )}
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: '#4FD9C9' }}>
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-[12.5px] vt-muted">&copy; {year} Vintec. Todos os direitos reservados.</p>
          <a href="#topo" className="text-[12.5px] font-semibold" style={{ color: '#4FD9C9' }}>Voltar ao topo ↑</a>
        </div>
      </div>
    </footer>
  )
}
