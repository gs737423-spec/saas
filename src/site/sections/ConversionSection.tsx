import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, MessageCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { contact, specialistHref } from '@/site/content'

const CHANNELS = ['Mercado Livre', 'Amazon', 'Shopee', 'Leroy Merlin', 'Outros']
const ORDER_RANGES = ['Até 100 pedidos', '100 a 500', '500 a 2.000', '2.000 a 10.000', 'Mais de 10.000']

type Status = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured'

type FormState = {
  name: string
  email: string
  whatsapp: string
  company: string
  marketplaces: string[]
  monthlyOrders: string
  mainDifficulty: string
  consent: boolean
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.replace(/(\d{0,2})/, '($1')
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, '($1) $2')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Conversão única — funde os dois CommercialBanner humanos + o antigo Demo em
// uma só seção, sem pessoa (protagonismo pro formulário). Gradiente oficial.
export default function ConversionSection() {
  const [status, setStatus] = useState<Status>('idle')
  const [showOptional, setShowOptional] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', email: '', whatsapp: '', company: '', marketplaces: [], monthlyOrders: '', mainDifficulty: '', consent: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const waHref = specialistHref('Olá! Gostaria de falar com um especialista da Vintec.')

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Informe seu nome.'
    if (!emailRe.test(form.email.trim())) e.email = 'Informe um e-mail válido.'
    if (form.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Informe um WhatsApp com DDD.'
    if (!form.company.trim()) e.company = 'Informe o nome da empresa.'
    if (!form.consent) e.consent = 'É necessário concordar para continuar.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (status === 'loading') return
    if (!validate()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, marketplaces: form.marketplaces.join(', ') }),
      })
      if (res.ok) { setStatus('success'); return }
      if (res.status === 501 || res.status === 404) { setStatus('unconfigured'); return }
      if (res.status === 422) {
        const data = await res.json().catch(() => null)
        if (data?.fields) {
          const fe: Record<string, string> = {}
          for (const f of data.fields as string[]) fe[f] = 'Campo obrigatório.'
          setErrors(fe)
        }
        setStatus('idle'); return
      }
      setStatus('error')
    } catch {
      setStatus('unconfigured')
    }
  }

  if (status === 'success') {
    return (
      <section id="conversao" className="sec-conversion scroll-mt-24">
        <div className="site-container py-16 md:py-20">
          <Reveal className="vt-card mx-auto max-w-xl p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(120,202,255,0.14)', color: '#78CAFF' }}>
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="site-h3 mt-5 vt-ink">Pedido recebido!</h2>
            <p className="site-lead mt-3 vt-muted">Recebemos sua solicitação. Nosso time entrará em contato pelo WhatsApp ou e-mail informado.</p>
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section id="conversao" className="sec-conversion scroll-mt-24">
      <div className="site-container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="site-label mb-3" style={{ color: '#78CAFF' }}>Próximo passo</span>
            <h2 className="site-h2 vt-ink">Vamos entender como sua equipe acompanha os marketplaces hoje.</h2>
            <p className="site-lead mt-4 vt-muted">Conte brevemente como sua empresa trabalha. A equipe da Vintec analisa o cenário e explica de que forma pode ajudar.</p>
            <ul className="mt-6 space-y-2.5">
              {['Entendemos os controles utilizados', 'Verificamos os marketplaces', 'Identificamos tarefas repetidas', 'Explicamos os próximos passos'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14.5px] vt-muted">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#78CAFF' }} /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] vt-muted">Conversa inicial, sem compromisso.</p>

            {waHref.startsWith('http') && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold hover:underline" style={{ color: '#78CAFF' }}>
                <MessageCircle className="h-4 w-4" /> Prefere falar direto? Envie uma mensagem no WhatsApp
              </a>
            )}
          </div>

          <Reveal className="vt-card p-6 md:p-8 lg:col-span-7">
            <form onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" error={errors.name} htmlFor="f-name">
                  <input id="f-name" className="vt-input" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="name" />
                </Field>
                <Field label="E-mail profissional" error={errors.email} htmlFor="f-email">
                  <input id="f-email" type="email" className="vt-input" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
                </Field>
                <Field label="WhatsApp com DDD" error={errors.whatsapp} htmlFor="f-phone">
                  <input id="f-phone" inputMode="tel" placeholder="(11) 99999-9999" className="vt-input" value={form.whatsapp} onChange={(e) => set('whatsapp', maskPhone(e.target.value))} aria-invalid={!!errors.whatsapp} />
                </Field>
                <Field label="Nome da empresa" error={errors.company} htmlFor="f-company">
                  <input id="f-company" className="vt-input" value={form.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!errors.company} autoComplete="organization" />
                </Field>
              </div>

              <button type="button" onClick={() => setShowOptional((v) => !v)} aria-expanded={showOptional}
                className="mt-4 text-[12.5px] font-semibold hover:underline vt-muted">
                {showOptional ? 'Ocultar detalhes da rotina' : '+ Conte um pouco sobre sua rotina'}
              </button>

              {showOptional && (
                <div className="mt-3 space-y-4 rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <fieldset>
                    <legend className="mb-2 text-[12px] font-semibold vt-muted">Em quais marketplaces sua empresa vende?</legend>
                    <div className="flex flex-wrap gap-2">
                      {CHANNELS.map((c) => {
                        const on = form.marketplaces.includes(c)
                        return (
                          <button type="button" key={c} onClick={() => set('marketplaces', on ? form.marketplaces.filter((x) => x !== c) : [...form.marketplaces, c])}
                            aria-pressed={on}
                            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                            style={on ? { background: '#275DFF', color: '#062229', border: '1px solid #275DFF' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(214,235,232,0.82)', border: '1px solid rgba(255,255,255,0.14)' }}>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <Field label="Quantos pedidos recebe aproximadamente?" htmlFor="f-orders">
                    <select id="f-orders" className="vt-input" value={form.monthlyOrders} onChange={(e) => set('monthlyOrders', e.target.value)}>
                      <option value="">Selecione (opcional)</option>
                      {ORDER_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>

                  <Field label="Qual é a maior dificuldade hoje?" htmlFor="f-difficulty">
                    <input id="f-difficulty" className="vt-input" value={form.mainDifficulty} onChange={(e) => set('mainDifficulty', e.target.value)} placeholder="Opcional" />
                  </Field>
                </div>
              )}

              <label className="mt-5 flex items-start gap-2.5 text-[13px] vt-muted">
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" aria-invalid={!!errors.consent} />
                <span>Concordo em ser contatado e com o tratamento dos meus dados conforme a <Link to="/privacidade" style={{ color: '#78CAFF', textDecoration: 'underline' }}>Política de Privacidade</Link>.</span>
              </label>
              {errors.consent && <p className="mt-1 text-[12px]" style={{ color: 'var(--s-rose)' }}>{errors.consent}</p>}

              {status === 'unconfigured' && (
                <p className="mt-4 flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(233,168,58,0.12)', border: '1px solid rgba(233,168,58,0.3)', color: '#F0C572' }}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>O envio automático ainda não está configurado neste ambiente. {contact.email ? <>Escreva para <a href={`mailto:${contact.email}`} style={{ textDecoration: 'underline' }}>{contact.email}</a>.</> : 'Configure LEADS_WEBHOOK_URL para ativar o recebimento.'}</span>
                </p>
              )}
              {status === 'error' && (
                <p className="mt-4 flex items-center gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(240,70,108,0.12)', border: '1px solid rgba(240,70,108,0.3)', color: '#FF8FA6' }}>
                  <AlertCircle className="h-4 w-4" /> Não foi possível enviar agora. Tente novamente em instantes.
                </p>
              )}

              <button type="submit" disabled={status === 'loading'} className="btn btn-primary mt-6 w-full" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
                {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <>Fale com um especialista <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Field({ label, error, htmlFor, children, className = '' }: { label: string; error?: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold vt-muted">{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px]" style={{ color: '#FF8FA6' }} role="alert">{error}</p>}
    </div>
  )
}
