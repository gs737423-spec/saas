import { marketplaces } from '@/site/content'

// Faixa de logos em movimento contínuo. Duas cópias idênticas garantem loop
// sem salto (translateX -50%); a segunda é aria-hidden. Máscara nas pontas e
// pausa no hover (CSS). Respeita prefers-reduced-motion (CSS).
export default function MarketplaceMarquee() {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
      style={{ gap: 'clamp(40px, 6vw, 76px)', paddingInline: 'clamp(20px, 3vw, 38px)' }}
    >
      {marketplaces.map((m) => (
        <li key={m.name} className="marquee-logo" title={m.name}>
          <m.Logo />
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-label="Canais e marketplaces" className="border-y" style={{ borderColor: 'var(--s-line)', background: 'var(--s-surface)' }}>
      <div className="site-container py-10 md:py-12">
        <p className="mb-7 text-center text-[13.5px] font-semibold" style={{ color: 'var(--s-muted)' }}>
          Conecte os canais onde sua operação acontece
        </p>
        <div className="marquee">
          <div className="marquee__track" style={{ ['--marquee-duration' as string]: '36s' }}>
            <Row />
            <Row hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
