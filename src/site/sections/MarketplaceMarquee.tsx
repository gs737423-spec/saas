import { marketplaces } from '@/site/content'

// Faixa de logos em movimento contínuo, encaixada abaixo do hero. Duas cópias
// idênticas garantem loop sem salto (translateX -50%); a segunda é aria-hidden.
// Canais futuros levam um selo "em breve" — a faixa não sugere que todos já
// funcionam. Máscara nas pontas, pausa no hover (CSS), respeita reduced-motion.
export default function MarketplaceMarquee() {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
      style={{ gap: 'clamp(38px, 5vw, 68px)', paddingInline: 'clamp(19px, 2.5vw, 34px)' }}
    >
      {marketplaces.map((m) => (
        <li key={m.name} className="flex items-center gap-2" title={m.name}>
          <span className="marquee-logo"><m.Logo /></span>
          {m.status === 'em-breve' && (
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(233,168,58,0.16)', color: '#B87914' }}>em breve</span>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <section
      aria-label="Canais e marketplaces"
      className="border-y"
      style={{ borderColor: 'var(--s-line-strong)', background: 'var(--s-bg-soft)' }}
    >
      <div className="site-container py-8 md:py-9">
        <p className="mb-6 text-center text-[13.5px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>
          Os principais canais da sua operação, conectados em uma única visão.
        </p>
        <div className="marquee">
          <div className="marquee__track" style={{ ['--marquee-duration' as string]: '30s' }}>
            <Row />
            <Row hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
