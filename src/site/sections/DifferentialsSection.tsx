import { Clock, ShieldCheck, UserCheck, Eye, TrendingUp, KeyRound } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import DifferentialRow from '@/site/components/DifferentialRow'
import { differentialRows } from '@/site/data/differentials'

const rowIcons = [Clock, ShieldCheck, UserCheck, Eye, TrendingUp, KeyRound]

// Por que Vintec — composição editorial (5/7 colunas), sem pills/grid de
// checkbox. Fundo warm (a superfície azul-clara anterior foi reprovada).
export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="sec-warm scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <span className="mb-3 inline-block text-[13px] font-bold uppercase" style={{ color: 'var(--vintec-blue-700)', letterSpacing: '0.12em' }}>
              Por que Vintec
            </span>
            <h2 className="font-extrabold" style={{ color: 'var(--vintec-text)', fontSize: 'clamp(1.9rem, 3vw, 2.5rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
              Informações reunidas só fazem diferença quando ajudam sua equipe.
            </h2>
            <p className="mt-4" style={{ color: 'var(--vintec-text-soft)', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: '46ch' }}>
              A Vintec combina conexão, organização e acompanhamento para tornar a gestão dos marketplaces mais simples no dia a dia.
            </p>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7">
            {differentialRows.map((item, i) => (
              <DifferentialRow key={item.n} item={item} Icon={rowIcons[i]} />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
