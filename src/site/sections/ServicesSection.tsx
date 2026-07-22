import { LayoutGrid, Target, FileMinus2 } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import DifferentialRow from '@/site/components/DifferentialRow'
import { outcomes } from '@/site/data/outcomes'

const outcomeIcons = [LayoutGrid, Target, FileMinus2]

// Benefícios — editorial, sem comparação, sem cards. Painel principal à
// esquerda (título + lista + fechamento âmbar), três linhas de resultado à
// direita. Fundo escuro.
export default function ServicesSection() {
  return (
    <section id="servicos" className="sec-dark-flat scroll-mt-24">
      <div className="site-container site-container--tight py-16 md:py-[88px]" style={{ maxWidth: 1220 }}>
        <Reveal>
          <span className="mb-4 inline-block text-[12.5px] font-bold uppercase" style={{ color: '#9DDCFF', letterSpacing: '0.14em' }}>
            O QUE MUDA NA PRÁTICA
          </span>
          <h2 className="font-extrabold" style={{ color: '#fff', fontSize: 'clamp(1.9rem, 2.8vw, 2.65rem)', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: 760 }}>
            Sua equipe para de procurar informações e começa a agir mais rápido.
          </h2>
          <p className="mt-4" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: 720 }}>
            A Vintec reúne o que hoje está espalhado entre painéis, planilhas e pessoas para que sua equipe enxergue prioridades antes que os problemas cresçam.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal delay={70} className="lg:col-span-7">
            <div className="services-panel">
              <h3 className="font-extrabold" style={{ color: '#fff', fontSize: '1.35rem', letterSpacing: '-0.01em' }}>
                Uma visão única para acompanhar a operação
              </h3>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Pedidos, estoque, vendas e resultados deixam de ficar espalhados em diferentes acessos e passam a seguir uma mesma rotina de acompanhamento.
              </p>
              <ul className="services-list">
                <li>Veja o que aconteceu em cada marketplace.</li>
                <li>Acompanhe pedidos e estoque com menos buscas.</li>
                <li>Compare resultados sem montar relatórios separados.</li>
                <li>Identifique rapidamente o que precisa de atenção.</li>
              </ul>
              <p className="services-closing">Menos tempo procurando números. Mais tempo tomando decisões.</p>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            {outcomes.map((item, i) => (
              <DifferentialRow key={item.n} item={item} Icon={outcomeIcons[i]} dark />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
