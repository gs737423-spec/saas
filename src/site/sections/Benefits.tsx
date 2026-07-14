import { KeyRound, Building2, Cloud, Users, ShieldCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { benefits } from '@/site/content'

const trust = [
  { icon: KeyRound, title: 'Controle de acesso e autenticação' },
  { icon: Building2, title: 'Dados separados por operação' },
  { icon: Cloud, title: 'Infraestrutura em nuvem (HTTPS)' },
  { icon: Users, title: 'Gestão de usuários' },
]

// Benefícios + Confiança em uma única seção compacta.
export default function Benefits() {
  return (
    <section id="beneficios" style={{ background: 'var(--s-bg)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          {/* Benefícios */}
          <div>
            <SectionHeader
              label="Benefícios para a operação"
              title={
                <>
                  Menos tempo organizando dados.
                  <br />
                  Mais clareza para decidir.
                </>
              }
            />
            <ol className="mt-8 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {benefits.map((b, i) => (
                <Reveal as="li" key={b} delay={(i % 2) * 60} className="flex items-start gap-3 border-b py-3.5" style={{ borderColor: 'var(--s-line)' }}>
                  <span className="mt-0.5 font-mono text-[12px] font-bold" style={{ color: 'var(--s-blue)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[14.5px] font-medium" style={{ color: 'var(--s-ink)' }}>{b}</span>
                </Reveal>
              ))}
            </ol>
          </div>

          {/* Confiança */}
          <Reveal delay={80} className="lg:pl-6">
            <div className="site-card h-full p-6 md:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
                <ShieldCheck className="h-5.5 w-5.5" />
              </span>
              <h3 className="site-h3 mt-4" style={{ color: 'var(--s-ink)' }}>Dados tratados com responsabilidade.</h3>
              <p className="mt-2 text-[14px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.55 }}>
                Boas práticas de acesso e organização das informações — descritas de forma transparente, sem promessas que não podemos comprovar.
              </p>
              <ul className="mt-5 space-y-2.5">
                {trust.map((t) => (
                  <li key={t.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--s-bg-soft)', border: '1px solid var(--s-line)' }}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(76,130,247,0.1)', color: 'var(--s-blue)' }}>
                      <t.icon className="h-4 w-4" />
                    </span>
                    <span className="text-[13.5px] font-semibold" style={{ color: 'var(--s-ink)' }}>{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
