import { ShieldCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { marketplaces, statusLabel, statusTone, securityPoints } from '@/site/content'

// Integrações + Segurança em uma seção institucional. Status honesto por
// canal — nenhuma integração é apresentada como "disponível" sem validação
// em produção (ver api/integrations/status.ts). Não depende só de cor:
// cada status também tem texto.
export default function IntegrationsSecurity() {
  return (
    <section style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-14 md:py-20">
        <div id="integracoes" className="scroll-mt-24">
          <SectionHeader
            label="Integrações"
            title="Conexões por API, com status honesto por canal."
            desc="Nem todas as integrações estão disponíveis hoje. Mostramos exatamente em que estágio cada uma está."
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {marketplaces.map((m, i) => (
              <Reveal key={m.name} delay={(i % 4) * 50}>
                <div className="site-card glow-on-hover flex h-full flex-col justify-between gap-3 p-4" style={{ minHeight: 104 }}>
                  <span className="marquee-logo" style={{ opacity: 1, filter: 'none' }}><m.Logo /></span>
                  <div>
                    <div className="text-[13.5px] font-bold leading-tight" style={{ color: 'var(--s-ink)' }}>{m.name}</div>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: `${statusTone[m.status]}18`, color: statusTone[m.status] }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: statusTone[m.status], display: 'inline-block' }} />
                      {statusLabel[m.status]}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div id="seguranca" className="mt-14 scroll-mt-24 border-t pt-10" style={{ borderColor: 'var(--s-line)' }}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
                <ShieldCheck className="h-5.5 w-5.5" />
              </span>
              <SectionHeader
                className="mt-5"
                label="Segurança"
                title="Dados tratados com responsabilidade."
                desc="Boas práticas de acesso e organização das informações, descritas de forma transparente."
              />
            </div>

            <Reveal>
              <ul className="grid gap-3 sm:grid-cols-2">
                {securityPoints.map((p) => (
                  <li key={p} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: 'var(--s-bg-soft)', border: '1px solid var(--s-line)' }}>
                    <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--s-emerald)' }} />
                    <span className="text-[13.5px] font-medium" style={{ color: 'var(--s-ink)' }}>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
