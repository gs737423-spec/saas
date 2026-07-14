import { X, Check, ArrowRight } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { problemBefore, problemAfter } from '@/site/content'

// Problema resumido — funde as antigas seções "dados espalhados" +
// comparação antes/depois + lista de dificuldades em um único bloco
// compacto. Não repete o hero, não ocupa uma tela inteira.
export default function ProblemSection() {
  return (
    <section id="desafio" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-14 md:py-18">
        <SectionHeader
          label="O problema"
          title="Mais canais não deveriam significar menos clareza."
          desc="Cada marketplace fala uma língua diferente de números. Sem padronização, decisões chegam atrasadas."
          align="center"
        />

        <Reveal className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="site-card p-5">
            <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-rose)' }}>Hoje</span>
            <ul className="mt-3 space-y-2">
              {problemBefore.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: 'var(--s-ink-soft)' }}>
                  <X className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--s-rose)' }} /> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden items-center justify-center sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
              <ArrowRight className="h-4.5 w-4.5" />
            </span>
          </div>

          <div className="site-dark-card p-5">
            <span className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-blue-bright)' }}>Com a plataforma</span>
            <ul className="mt-3 space-y-2">
              {problemAfter.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: 'var(--s-dark-ink)' }}>
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--s-emerald)' }} /> {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
