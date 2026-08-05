import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import { contact, marketplaces, specialistHref } from '@/site/content'
import MKTOnlineLogo from '@/components/brand/MKTOnlineLogo'

// Footer editorial — wordmark textual (sem símbolo), bloco institucional +
// 4 colunas de navegação, barra legal inferior. Fundo azul-marinho.
export default function Footer() {
  const year = new Date().getFullYear()
  const specialist = specialistHref()

  return (
    <footer id="privacidade-anchor" className="sec-footer-flat">
      <div className="site-container site-container--tight" style={{ maxWidth: 1220, paddingTop: 48, paddingBottom: 28 }}>
        <div className="grid gap-10 lg:grid-cols-[30%_1fr]">
          <div className="footer-main max-w-[320px]">
            <div className="flex items-center gap-2 mb-2">
              <MKTOnlineLogo mode="symbol" size="sm" />
              <span className="footer-word">MKTOnline</span>
            </div>
            <p className="footer-desc" style={{ marginTop: 10 }}>
              Consultoria e tecnologia para empresas que vendem em múltiplos marketplaces.
            </p>
            <a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="footer-cta">
              Fale com um especialista <ArrowRight className="h-3.5 w-3.5" />
            </a>

            <div className="footer-contact">
              <a href={`mailto:${contact.email}`} className="footer-contact__row">
                <Mail className="h-3.5 w-3.5" /> {contact.email}
              </a>
              <a href={`mailto:${contact.diretoriaEmail}`} className="footer-contact__row">
                <Mail className="h-3.5 w-3.5" /> {contact.diretoriaEmail}
              </a>
              {specialist.startsWith('http') && (
                <a href={specialist} target="_blank" rel="noopener noreferrer" className="footer-contact__row">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp comercial
                </a>
              )}
            </div>
          </div>

          <div className="footer-cols grid grid-cols-1 gap-y-7 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            <nav aria-label="Rodapé — soluções">
              <h3 className="footer-col-title">Soluções</h3>
              <ul className="footer-col-list">
                <li><a href="#servicos" className="footer-link">Consultoria estratégica</a></li>
                <li><a href="#plataforma" className="footer-link">Plataforma de gestão</a></li>
                <li><a href="#como-trabalhamos" className="footer-link">Acompanhamento da operação</a></li>
                <li><a href="#marketplaces" className="footer-link">Performance por canal</a></li>
              </ul>
            </nav>

            <div>
              <h3 className="footer-col-title">Canais monitorados</h3>
              <ul className="footer-col-list">
                {marketplaces.map((m) => (
                  <li key={m.name} className="footer-link footer-link--static">{m.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="footer-col-title">Empresa</h3>
              <ul className="footer-col-list">
                <li><a href="#sobre" className="footer-link">Quem somos</a></li>
                <li><a href="#como-trabalhamos" className="footer-link">Como funciona</a></li>
                <li><a href="#faq" className="footer-link">FAQ</a></li>
                <li><a href="#conversao" className="footer-link">Contato</a></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-col-title">Acesso</h3>
              <ul className="footer-col-list">
                <li><Link to="/login" className="footer-link">Entrar</Link></li>
                <li><a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="footer-link">Agendar conversa estratégica</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-legal">
          <div className="footer-legal__links">
            <Link to="/privacidade" className="footer-link">Política de Privacidade</Link>
            <Link to="/termos" className="footer-link">Termos de Uso</Link>
          </div>
          <p className="footer-legal__copy">&copy; {year} MKTOnline. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
