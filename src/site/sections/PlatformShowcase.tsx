import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import BrowserFrame from '@/site/components/BrowserFrame'
import { platformTabs, type PlatformView } from '@/site/content'

export default function PlatformShowcase() {
  const [active, setActive] = useState(0)
  const [showSecondary, setShowSecondary] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function select(i: number) {
    setActive(i)
    setShowSecondary(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = platformTabs.length - 1
    let next = active
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  const tab = platformTabs[active]
  const view: PlatformView = showSecondary && tab.secondary ? tab.secondary : tab

  return (
    <section id="produto" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-14 md:py-20">
        <SectionHeader
          label="Produto"
          title="Uma visão completa da operação, sem trocar entre sistemas."
          desc="Do resultado geral ao desempenho individual de cada produto, os indicadores que realmente ajudam a decidir."
        />

        {/* Abas — scroll horizontal no mobile */}
        <div className="mt-8 -mx-5 overflow-x-auto px-5 hide-scrollbar">
          <div
            role="tablist"
            aria-label="Áreas da plataforma"
            onKeyDown={onKeyDown}
            className="inline-flex gap-1 rounded-2xl p-1"
            style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)' }}
          >
            {platformTabs.map((t, i) => {
              const selected = i === active
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[i] = el }}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  className="whitespace-nowrap rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors"
                  style={
                    selected
                      ? { background: 'linear-gradient(180deg,var(--s-blue-bright),var(--s-blue))', color: '#fff', boxShadow: '0 8px 18px -10px rgba(61,116,240,0.7)' }
                      : { color: 'var(--s-ink-soft)', background: 'transparent' }
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel — 35/65, imagem grande. Altura estável, conteúdo sincronizado */}
        <div
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-12"
        >
          <div key={`text-${tab.id}-${showSecondary}`} className="tab-panel order-2 lg:order-1">
            {/* Sub-seletor Produto 360 (só na aba Produtos) */}
            {tab.secondary && (
              <div className="mb-5 inline-flex rounded-xl p-0.5" style={{ background: 'var(--s-bg-soft)', border: '1px solid var(--s-line)' }}>
                {[{ k: false, label: tab.label }, { k: true, label: tab.secondary.label }].map((o) => {
                  const on = showSecondary === o.k
                  return (
                    <button
                      key={String(o.k)}
                      onClick={() => setShowSecondary(o.k)}
                      aria-pressed={on}
                      className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                      style={on ? { background: 'var(--s-surface)', color: 'var(--s-blue-ink)', boxShadow: '0 2px 6px -2px rgba(16,26,49,0.2)' } : { color: 'var(--s-muted)' }}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            )}
            <h3 className="site-h3" style={{ color: 'var(--s-ink)' }}>{view.title}</h3>
            <p className="site-lead mt-3">{view.desc}</p>
            <ul className="mt-6 space-y-3">
              {view.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(18,185,129,0.12)', color: 'var(--s-emerald)' }}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] font-medium" style={{ color: 'var(--s-ink-soft)' }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div key={`img-${tab.id}-${showSecondary}`} className="tab-panel order-1 lg:order-2">
            <BrowserFrame src={view.image} alt={view.alt} caption={view.title} priority={active === 0} />
          </div>
        </div>
      </div>
    </section>
  )
}
