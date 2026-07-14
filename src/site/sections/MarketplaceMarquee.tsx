import { marketplaces } from '@/site/content'

// Faixa de logos — assinatura visual do site, encaixada na base do hero.
// Cada unidade mostra logo + nome COMPLETO (nunca truncado, white-space
// nowrap + shrink-0) + selo de conexão. Duas cópias idênticas garantem loop
// sem salto (translateX -50%); a segunda é aria-hidden. Máscara nas pontas
// só entra depois que a última unidade de cada lado já está inteira (padding
// interno maior que a área mascarada), então nada "nasce cortado".
export default function MarketplaceMarquee() {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
      style={{ gap: 'clamp(44px, 5vw, 72px)', paddingInline: 'clamp(44px, 5vw, 72px)' }}
    >
      {marketplaces.map((m) => (
        <li key={m.name} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap" title={m.name}>
          <span className="marquee-logo shrink-0"><m.Logo /></span>
          <span className="shrink-0 whitespace-nowrap text-[14px] font-semibold" style={{ color: 'var(--s-ink)' }}>{m.name}</span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:flex"
            style={{ background: 'rgba(18,185,129,0.12)', color: '#0E8F63' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#12B981', display: 'inline-block' }} />
            API
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <section
      aria-label="Ecossistema de marketplaces conectados"
      className="marquee-band border-y"
      style={{ borderColor: 'var(--s-line-strong)' }}
    >
      <div className="site-container">
        <p className="marquee-band__label text-center text-[13.5px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>
          Os principais canais da sua operação, conectados em uma única visão.
        </p>
        <div className="marquee">
          <div className="marquee__track" style={{ ['--marquee-duration' as string]: '32s' }}>
            <Row />
            <Row hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
