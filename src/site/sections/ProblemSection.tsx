import { FileSpreadsheet, AlertTriangle, ArrowRight, Layers } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { problems } from '@/site/content'
import { marketplaces } from '@/site/content'

export default function ProblemSection() {
  const channels = marketplaces.slice(0, 4)

  return (
    <section id="desafio" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="O desafio da operação multicanal"
          title={
            <>
              Seus dados estão espalhados.
              <br />
              Suas decisões não deveriam estar.
            </>
          }
          desc="Quando cada marketplace apresenta números, formatos e relatórios diferentes, entender o resultado real da operação se torna lento, inseguro e dependente de planilhas."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Antes — disperso */}
          <Reveal className="site-card" >
            <div className="p-6 md:p-7">
              <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-rose)' }}>Hoje</span>
              <h3 className="site-h3 mt-2" style={{ color: 'var(--s-ink)' }}>Planilhas e sistemas isolados</h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {channels.map((c) => (
                  <span key={c.name} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ border: '1px dashed var(--s-line-strong)', background: 'var(--s-bg-soft)' }}>
                    <FileSpreadsheet className="h-4 w-4" style={{ color: 'var(--s-muted)' }} />
                    <span className="text-[12.5px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>{c.name}.xlsx</span>
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(240,70,108,0.06)', border: '1px solid rgba(240,70,108,0.16)' }}>
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: 'var(--s-rose)' }} />
                <span className="text-[12.5px] font-medium" style={{ color: 'var(--s-ink-soft)' }}>
                  Números que não batem entre canais
                </span>
              </div>
            </div>
          </Reveal>

          {/* Seta de convergência */}
          <div className="hidden items-center justify-center lg:flex">
            <span className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>

          {/* Depois — centralizado */}
          <Reveal className="site-dark-card" delay={120}>
            <div className="p-6 md:p-7">
              <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-blue-bright)' }}>Com a Acelera</span>
              <h3 className="site-h3 mt-2" style={{ color: 'var(--s-dark-ink)' }}>Uma visão centralizada</h3>
              <div className="mt-5 flex items-center gap-3 rounded-2xl p-4"
                style={{ background: 'rgba(76,130,247,0.08)', border: '1px solid var(--s-dark-line)' }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(76,130,247,0.18)', color: 'var(--s-blue-bright)' }}>
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[19px] font-extrabold" style={{ color: 'var(--s-dark-ink)' }}>R$ 284.520</div>
                  <div className="text-[12px]" style={{ color: 'var(--s-dark-muted)' }}>faturamento consolidado · 4 canais</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {channels.map((c, i) => (
                  <div key={c.name} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--s-dark-line)' }}>
                    <div className="text-[11px]" style={{ color: 'var(--s-dark-muted)' }}>{c.name}</div>
                    <div className="text-[13px] font-bold" style={{ color: 'var(--s-dark-ink)' }}>{[42, 22, 16, 20][i]}%</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Lista de problemas — refinada, não em cards iguais */}
        <Reveal className="mt-12" delay={80}>
          <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {problems.map((p) => (
              <li key={p} className="flex items-start gap-3 border-b py-3" style={{ borderColor: 'var(--s-line)' }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--s-rose)' }} />
                <span className="text-[15px]" style={{ color: 'var(--s-ink-soft)' }}>{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
