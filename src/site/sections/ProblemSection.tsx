import { Link2, AlertTriangle, ArrowRight, Layers } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { problems, marketplaces } from '@/site/content'

// Problema + solução em um único bloco. A frase de posicionamento
// ("Não é apenas reunir dados...") fecha a seção — não é mais uma seção
// isolada. Cabe em ~1 tela no desktop.
export default function ProblemSection() {
  const channels = marketplaces.slice(0, 4)

  return (
    <section id="desafio" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          {/* Esquerda — narrativa */}
          <div>
            <SectionHeader
              label="O desafio da operação multicanal"
              title={
                <>
                  Seus dados estão espalhados.
                  <br />
                  Suas decisões não deveriam estar.
                </>
              }
              desc="Quando cada canal apresenta números, formatos e indicadores separados, entender o resultado real da operação se torna lento e inseguro."
            />
            <ul className="mt-7 space-y-2.5">
              {problems.map((p, i) => (
                <Reveal as="li" key={p} delay={i * 60} className="flex items-center gap-3 border-b py-3" style={{ borderColor: 'var(--s-line)' }}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(240,70,108,0.1)', color: 'var(--s-rose)' }}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[15px] font-medium" style={{ color: 'var(--s-ink-soft)' }}>{p}</span>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Direita — antes/depois (contas conectadas, sem arquivos) */}
          <Reveal delay={80}>
            <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
              {/* Antes */}
              <div className="site-card p-5">
                <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-rose)' }}>Hoje</span>
                <h3 className="mt-1 text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>Canais isolados</h3>
                <div className="mt-4 space-y-2">
                  {channels.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                      style={{ border: '1px dashed var(--s-line-strong)', background: 'var(--s-bg-soft)' }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: 'var(--s-line-strong)' }} />
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>{c.name}</span>
                      <span className="ml-auto text-[10.5px]" style={{ color: 'var(--s-muted)' }}>conta separada</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seta */}
              <div className="hidden items-center justify-center sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full hero-float-b"
                  style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
                  <ArrowRight className="h-4.5 w-4.5" />
                </span>
              </div>

              {/* Depois */}
              <div className="site-dark-card p-5">
                <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-blue-bright)' }}>Com a Acelera</span>
                <h3 className="mt-1 text-[15px] font-bold" style={{ color: 'var(--s-dark-ink)' }}>Uma visão central</h3>
                <div className="mt-4 flex items-center gap-2.5 rounded-xl p-3"
                  style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid var(--s-dark-line)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(76,130,247,0.2)', color: 'var(--s-blue-bright)' }}>
                    <Layers className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="text-[16px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>R$ 284.520</div>
                    <div className="text-[10.5px]" style={{ color: 'var(--s-dark-muted)' }}>consolidado · 4 canais</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {channels.map((c, i) => (
                    <div key={c.name} className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--s-dark-line)' }}>
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--s-dark-muted)' }}>
                        <Link2 className="h-3 w-3" style={{ color: 'var(--s-emerald)' }} />{c.name}
                      </div>
                      <div className="text-[12.5px] font-bold" style={{ color: 'var(--s-dark-ink)' }}>{[42, 22, 16, 20][i]}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Fecho de posicionamento — linha de destaque, não uma nova tela */}
        <Reveal delay={60} className="mt-10 border-t pt-6 text-center" style={{ borderColor: 'var(--s-line)' }}>
          <p className="mx-auto max-w-2xl font-bold tracking-tight"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', lineHeight: 1.3, letterSpacing: '-0.015em', color: 'var(--s-ink-soft)' }}>
            Não é apenas reunir dados.{' '}
            <span style={{ color: 'var(--s-blue)' }}>É transformar a operação em uma visão clara.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
