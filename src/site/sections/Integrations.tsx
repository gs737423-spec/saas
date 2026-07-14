import { Plug, FileSpreadsheet, Clock } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { marketplaces, type IntegrationStatus } from '@/site/content'

const groups: { status: IntegrationStatus; icon: typeof Plug; title: string; note: string; tone: string }[] = [
  { status: 'ativo', icon: Plug, title: 'Integração por API', note: 'Conexão direta e sincronização automática', tone: '#12B981' },
  { status: 'planilha', icon: FileSpreadsheet, title: 'Importação por planilha', note: 'Envie os relatórios e centralize os dados', tone: '#4C82F7' },
  { status: 'em-breve', icon: Clock, title: 'Em desenvolvimento', note: 'Integrações planejadas para os próximos canais', tone: '#E9A83A' },
]

export default function Integrations() {
  return (
    <section id="integracoes" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="Integrações"
          title="Um único painel para os canais que fazem parte da sua operação."
          desc="Seja transparente: mostramos o que já está disponível hoje e o que ainda está a caminho."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {groups.map((g, gi) => {
            const list = marketplaces.filter((m) => m.status === g.status)
            return (
              <Reveal key={g.status} delay={gi * 90}>
                <div className="site-card h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${g.tone}18`, color: g.tone }}>
                      <g.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--s-ink)' }}>{g.title}</h3>
                      <p className="text-[12px]" style={{ color: 'var(--s-muted)' }}>{g.note}</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {list.map((m) => (
                      <li key={m.name} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: 'var(--s-bg-soft)', border: '1px solid var(--s-line)' }}>
                        <span className="marquee-logo" style={{ filter: 'none', opacity: 1 }}><m.Logo /></span>
                        {g.status === 'em-breve' && (
                          <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'rgba(233,168,58,0.14)', color: '#B87914' }}>
                            Em breve
                          </span>
                        )}
                        {g.status === 'ativo' && (
                          <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'rgba(18,185,129,0.14)', color: '#0E8F63' }}>
                            Disponível
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
