import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mark from '@/assets/acelera-mark.png'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'
import PrivacyPolicyPage from '@/site/PrivacyPolicyPage'
import './site.css'

type Variant = 'privacidade' | 'termos'

// Conteúdo de 'privacidade' foi substituído pela reconstrução completa em
// PrivacyPolicyPage.tsx (ver branch abaixo) — não é mais usado aqui.
const CONTENT: Record<'termos', { title: string; intro: string; blocks: { h: string; p: string }[] }> = {
  termos: {
    title: 'Termos de Uso',
    intro: 'Resumo dos termos de uso do site institucional. O documento definitivo é fornecido pela empresa; este texto é um ponto de partida e deve ser revisado pelo responsável legal.',
    blocks: [
      { h: 'Sobre o site', p: 'Este site apresenta a plataforma Vintec e permite solicitar uma demonstração. As informações têm caráter institucional.' },
      { h: 'Uso das informações', p: 'Os números exibidos nas telas e composições são demonstrativos e servem para ilustrar as funcionalidades da plataforma.' },
      { h: 'Acesso à plataforma', p: 'O acesso à área da plataforma exige autenticação e é destinado a clientes e usuários autorizados.' },
    ],
  },
}

export default function LegalPage({ variant }: { variant: Variant }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="site-root" style={{ minHeight: '100vh' }}>
      <header className="site-header" data-scrolled="true">
        <div className="site-container flex h-[68px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Vintec — início">
            <img src={mark} alt="" width={34} height={34} className="h-8 w-8 object-contain" />
            <span className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>Vintec</span>
          </Link>
          <Link to="/" className="btn btn-ghost" style={{ padding: '0.5rem 0.9rem' }}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      {variant === 'privacidade' ? <PrivacyPolicyPage /> : (
        <main className="site-container py-16 md:py-24" style={{ maxWidth: 760 }}>
          <h1 className="site-h2" style={{ color: 'var(--s-ink)' }}>{CONTENT.termos.title}</h1>
          <p className="site-lead mt-4">{CONTENT.termos.intro}</p>
          <div className="mt-10 space-y-8">
            {CONTENT.termos.blocks.map((b) => (
              <section key={b.h}>
                <h2 className="site-h3" style={{ color: 'var(--s-ink)' }}>{b.h}</h2>
                <p className="mt-2 text-[15px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.65 }}>{b.p}</p>
              </section>
            ))}
          </div>
          <p className="mt-12 text-[13px]" style={{ color: 'var(--s-muted)' }}>
            &copy; {new Date().getFullYear()} Marketplace.
          </p>
        </main>
      )}
      <WhatsAppFloatButton />
    </div>
  )
}
