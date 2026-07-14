import { ShieldCheck, KeyRound, Building2, Cloud, History, Users } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'

const items = [
  { icon: KeyRound, title: 'Controle de acesso e autenticação', text: 'O acesso à plataforma exige autenticação. Cada usuário entra com suas credenciais.' },
  { icon: Building2, title: 'Dados separados por operação', text: 'Cada operação enxerga apenas os próprios dados dentro da plataforma.' },
  { icon: Cloud, title: 'Infraestrutura em nuvem', text: 'Hospedagem em nuvem com conexões protegidas por HTTPS.' },
  { icon: Users, title: 'Gestão de usuários', text: 'Definição de quem tem acesso à visão da operação.' },
  { icon: History, title: 'Histórico de importações', text: 'Registro das importações realizadas para rastrear a origem dos dados.' },
]

export default function Security() {
  return (
    <section style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
              <ShieldCheck className="h-6 w-6" />
            </span>
            <SectionHeader
              className="mt-5"
              title="Os dados da sua operação tratados com responsabilidade."
              desc="Boas práticas de acesso e organização das informações, descritas de forma transparente — sem promessas que não podemos comprovar."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.title} delay={(i % 2) * 60}>
                <div className="site-card site-card-hover h-full p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(76,130,247,0.1)', color: 'var(--s-blue)' }}>
                    <it.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{it.title}</h3>
                  <p className="mt-1.5 text-[13.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.5 }}>{it.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
