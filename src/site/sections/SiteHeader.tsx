import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight, Lock } from 'lucide-react'
import mark from '@/assets/acelera-mark.png'
import { nav, specialistHref } from '@/site/content'
import { useScrolled } from '@/site/hooks'

// Header dark glass — transparente sobre o hero petróleo no topo, vira barra
// glass sólida ao rolar. Modificador `site-header--dark` restringe o tema
// escuro a esta home (LegalPage mantém header claro).
export default function SiteHeader() {
  const scrolled = useScrolled(8)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const specialist = specialistHref()

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
    <header className="site-header site-header--dark" data-scrolled={scrolled}>
      <div
        className="site-container flex items-center justify-between gap-4 transition-[height] duration-300"
        style={{ height: scrolled ? 62 : 76 }}
      >
        {/* Logo → topo */}
        <a href="#topo" className="flex shrink-0 items-center gap-2.5" aria-label="Vintec — início">
          <img src={mark} alt="" width={38} height={38} className="h-9 w-9 object-contain" draggable={false} />
          <span className="text-[17px] font-extrabold tracking-tight" style={{ color: '#F2FBFA' }}>Vintec</span>
        </a>

        {/* Nav desktop — breakpoint 1100px (nav:) */}
        <nav className="hidden items-center gap-0.5 nav:flex" aria-label="Navegação principal">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="vt-nav-link">
              {n.label}
            </a>
          ))}
        </nav>

        {/* Ações desktop */}
        <div className="hidden items-center gap-2 nav:flex">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold transition-colors"
            style={{ color: 'rgba(234,244,243,0.85)' }}
          >
            <Lock className="h-3.5 w-3.5" /> Entrar
          </Link>
          <a href={specialist} target={specialist.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.6rem 1.15rem' }}>
            Fale com um especialista
          </a>
        </div>

        {/* Botão mobile */}
        <div className="nav:hidden">
          <button
            className="btn btn-glass"
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
          <div className="absolute inset-0" style={{ background: 'rgba(4,20,26,0.6)' }} onClick={() => setOpen(false)} />
          <div ref={panelRef} className="absolute inset-x-0 top-0 origin-top p-4">
            <div
              className="overflow-hidden p-2"
              style={{
                borderRadius: 24,
                background: 'linear-gradient(180deg, #0B3A45, #082A34)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 30px 60px -24px rgba(0,0,0,0.7)',
              }}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[13px] font-semibold" style={{ color: 'rgba(234,244,243,0.7)' }}>Menu</span>
                <button
                  className="rounded-lg p-1.5"
                  style={{ color: 'rgba(234,244,243,0.85)' }}
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
                    style={{ color: '#EAF4F3' }}
                  >
                    {n.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 p-2 pt-3">
                <Link to="/login" onClick={() => setOpen(false)} className="btn btn-glass w-full">Entrar</Link>
                <a
                  href={specialist}
                  target={specialist.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Fale com um especialista <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
