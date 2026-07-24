import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'

// Footer editorial — wordmark textual (sem símbolo), bloco institucional +
// 4 colunas de navegação, barra legal inferior. Fundo azul-marinho.
export default function Footer() {
  const year = new Date().getFullYear()
  const specialist = specialistHref()

  return (
    <footer id="privacidade-anchor" className="sec-footer-flat">
      <div className="site-container site-container--tight" style={{ maxWidth: 1220, paddingTop: 72, paddingBottom: 32 }}>
        <div className="grid gap-12 lg:grid-cols-[30%_1fr]">
          <div className="max-w-[320px]">
            <span className="footer-word">Vintec</span>
            <h2 className="footer-tagline">Menos telas. Mais controle sobre a operação.</h2>
            <p className="footer-desc">
              A Vintec reúne pedidos, estoque, vendas e resultados dos marketplaces para que gestores e equipes acompanhem a operação com menos controles paralelos.
            </p>
            <a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="footer-cta">
              Fale com um especialista <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            <nav aria-label="Rodapé — navegação">
              <h3 className="footer-col-title">Navegação</h3>
              <ul className="footer-col-list">
                <li><a href="#servicos" className="footer-link">Soluções</a></li>
                <li><a href="#marketplaces" className="footer-link">Marketplaces</a></li>
                <li><a href="#como-funciona" className="footer-link">Como funciona</a></li>
                <li><a href="#como-funciona" className="footer-link">Por que Vintec</a></li>
              </ul>
            </nav>

            <div>
              <h3 className="footer-col-title">Marketplaces</h3>
              <ul className="footer-col-list">
                {marketplaces.map((m) => (
                  <li key={m.name} className="footer-link footer-link--static">{m.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="footer-col-title">Institucional</h3>
              <ul className="footer-col-list">
                <li><a href="#sobre" className="footer-link">Quem somos</a></li>
                <li><a href="#faq" className="footer-link">FAQ</a></li>
                <li><a href="#conversao" className="footer-link">Contato</a></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-col-title">Acesso</h3>
              <ul className="footer-col-list">
                <li><Link to="/login" className="footer-link">Entrar</Link></li>
                <li><a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="footer-link">Fale com um especialista</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-legal">
          <div className="footer-legal__links">
            <Link to="/privacidade" className="footer-link">Política de Privacidade</Link>
            <Link to="/termos" className="footer-link">Termos de Uso</Link>
          </div>
          <p className="footer-legal__copy">&copy; {year} Vintec. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
