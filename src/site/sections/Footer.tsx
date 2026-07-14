import { Link } from 'react-router-dom'
import mark from '@/assets/acelera-mark.png'
import { nav, contact } from '@/site/content'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer id="privacidade-anchor" className="site-dark" style={{ borderTop: '1px solid var(--s-dark-line)' }}>
      <div className="site-container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca + descrição */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <img src={mark} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>Acelera</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--s-blue-bright)' }}>Intelligence</span>
              </span>
            </div>
            <p className="mt-4 text-[13.5px]" style={{ color: 'var(--s-dark-muted)', lineHeight: 1.6 }}>
              Plataforma de gestão e análise para operações que vendem em múltiplos marketplaces. Faturamento, margem, produtos e estoque em uma única visão.
            </p>
          </div>

          {/* Navegação */}
          <nav aria-label="Rodapé — navegação">
            <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-dark-muted)' }}>Navegação</h2>
            <ul className="mt-4 space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}><a href={n.href} className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>{n.label}</a></li>
              ))}
              <li><Link to="/login" className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>Entrar</Link></li>
              <li><a href="#demonstracao" className="text-[14px] font-semibold" style={{ color: 'var(--s-blue-bright)' }}>Solicitar demonstração</a></li>
            </ul>
          </nav>

          {/* Legal + contato */}
          <div>
            <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-dark-muted)' }}>Institucional</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/privacidade" className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>Política de Privacidade</Link></li>
              <li><Link to="/termos" className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>Termos de Uso</Link></li>
              {contact.email && (
                <li><a href={`mailto:${contact.email}`} className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>{contact.email}</a></li>
              )}
              {contact.whatsapp && (
                <li><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="text-[14px]" style={{ color: 'var(--s-dark-ink)' }}>WhatsApp</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row" style={{ borderColor: 'var(--s-dark-line)' }}>
          <p className="text-[12.5px]" style={{ color: 'var(--s-dark-muted)' }}>&copy; {year} Acelera Intelligence. Todos os direitos reservados.</p>
          <a href="#topo" className="text-[12.5px] font-semibold" style={{ color: 'var(--s-blue-bright)' }}>Voltar ao topo ↑</a>
        </div>
      </div>
    </footer>
  )
}
