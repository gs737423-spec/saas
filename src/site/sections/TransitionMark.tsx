import Reveal from '@/site/components/Reveal'

// Pequena seção de transição/posicionamento. Gera pausa visual antes da
// demonstração da plataforma.
export default function TransitionMark() {
  return (
    <section style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)', borderBottom: '1px solid var(--s-line)' }}>
      <div className="site-container py-20 text-center md:py-28">
        <Reveal>
          <p className="mx-auto max-w-3xl font-extrabold tracking-tight"
            style={{ fontSize: 'clamp(1.7rem, 4.2vw, 3rem)', lineHeight: 1.12, letterSpacing: '-0.025em', color: 'var(--s-ink)' }}>
            Não é apenas reunir dados.{' '}
            <span style={{ color: 'var(--s-blue)' }}>É transformar a operação em uma visão clara.</span>
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mx-auto mt-8 flex items-center justify-center gap-2" aria-hidden="true">
            <span style={{ width: 40, height: 2, background: 'var(--s-line-strong)' }} />
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--s-blue)' }} />
            <span style={{ width: 120, height: 2, background: 'linear-gradient(90deg, var(--s-line-strong), transparent)' }} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
