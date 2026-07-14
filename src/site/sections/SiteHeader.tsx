import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import mark from '@/assets/acelera-mark.png'
import { nav } from '@/site/content'
import { useScrolled } from '@/site/hooks'

export default function SiteHeader() {
  const scrolled = useScrolled(8)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Trava o scroll do fundo e habilita Esc/foco enquanto o menu está aberto
  useEffect(() => {
    if (!open) return
    document.body.classList.add('site-lock')
    firstLinkRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('site-lock')
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div
        className="site-container flex items-center justify-between gap-4 transition-[height] duration-300"
        style={{ height: scrolled ? 60 : 72 }}
      >
        {/* Logo → topo */}
        <a href="#topo" className="flex shrink-0 items-center gap-2.5" aria-label="Acelera Intelligence — início">
          <img src={mark} alt="" width={36} height={36} className="h-9 w-9 object-contain" draggable={false} />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>Acelera</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--s-blue-ink)' }}>Intelligence</span>
          </span>
        </a>

        {/* Nav desktop — breakpoint próprio (1100px): abaixo disso a navegação
            completa fica apertada ao lado dos dois CTAs, então cai pro menu
            mobile em vez de esperar o layout quebrar. Nunca aparece junto
            com o botão hambúrguer (mutuamente exclusivos pelo mesmo ponto). */}
        <nav className="hidden items-center gap-0.5 nav:flex" aria-label="Navegação principal">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors"
              style={{ color: 'var(--s-ink-soft)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--s-blue-ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--s-ink-soft)')}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Ações desktop */}
        <div className="hidden items-center gap-2 nav:flex">
          <Link to="/login" className="btn btn-ghost" style={{ padding: '0.6rem 1rem' }}>Entrar</Link>
          <a href="#demonstracao" className="btn btn-primary" style={{ padding: '0.6rem 1.1rem' }}>
            Solicitar demonstração
          </a>
        </div>

        {/* Botão mobile — wrapper sem classe de display própria, só pra evitar
            que `.btn` (display: inline-flex, especificidade igual à do
            utilitário responsivo) vença a troca de visibilidade por ordem
            de cascata em vez do breakpoint. */}
        <div className="nav:hidden">
          <button
            className="btn btn-ghost"
            style={{ padding: '0.55rem', borderRadius: 12 }}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div
          id="site-mobile-menu"
          className="fixed inset-0 z-[70] nav:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="absolute inset-0" style={{ background: 'rgba(9,14,26,0.5)' }} onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="absolute inset-x-0 top-0 origin-top p-4"
          >
            <div className="site-card overflow-hidden p-2" style={{ borderRadius: 24 }}>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--s-muted)' }}>Menu</span>
                <button
                  className="rounded-lg p-1.5"
                  style={{ color: 'var(--s-ink-soft)' }}
                  aria-label="Fechar menu"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col" aria-label="Navegação principal (mobile)">
                {nav.map((n, i) => (
                  <a
                    key={n.href}
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-[15px] font-medium"
                    style={{ color: 'var(--s-ink)' }}
                  >
                    {n.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 p-2 pt-3">
                <Link to="/login" onClick={() => setOpen(false)} className="btn btn-ghost w-full">Entrar</Link>
                <a href="#demonstracao" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                  Solicitar demonstração <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
