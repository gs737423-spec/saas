import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { contact } from '@/site/content'

const CHANNELS = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria', 'Outros']
const ORDER_RANGES = ['Até 100 pedidos', '100 a 500', '500 a 2.000', '2.000 a 10.000', 'Mais de 10.000']

type Status = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured'

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.replace(/(\d{0,2})/, '($1')
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, '($1) $2')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DemoForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', company: '', marketplaces: [] as string[], monthlyOrders: '', consent: false })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      // 501 = função existe mas sem LEADS_WEBHOOK_URL; 404 = sem função (dev/preview)
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
      // Sem backend disponível (ex.: dev local sem funções Vercel)
      setStatus('unconfigured')
    }
  }

  const inputStyle: React.CSSProperties = { background: 'var(--s-surface)', border: '1px solid var(--s-line-strong)', color: 'var(--s-ink)' }
  const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-[14.5px] outline-none transition-colors focus:border-[var(--s-blue)]'

  if (status === 'success') {
    return (
      <section id="demonstracao" style={{ background: 'var(--s-bg)' }}>
        <div className="site-container py-20 md:py-28">
          <Reveal className="site-card mx-auto max-w-xl p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(18,185,129,0.12)', color: 'var(--s-emerald)' }}>
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="site-h3 mt-5" style={{ color: 'var(--s-ink)' }}>Pedido recebido!</h2>
            <p className="site-lead mt-3">Recebemos sua solicitação de demonstração. Nosso time entrará em contato pelo WhatsApp ou e-mail informado.</p>
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section id="demonstracao" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <span className="site-label mb-3">Solicitar demonstração</span>
            <h2 className="site-h2" style={{ color: 'var(--s-ink)' }}>Veja a plataforma com os dados da sua operação.</h2>
            <p className="site-lead mt-4">Preencha os campos e nosso time mostra como centralizar seus marketplaces em uma única visão. Sem compromisso.</p>
            <ul className="mt-6 space-y-2.5">
              {['Demonstração guiada da plataforma', 'Tira-dúvidas sobre integração e importação', 'Orientação para a sua operação'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14.5px]" style={{ color: 'var(--s-ink-soft)' }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--s-emerald)' }} /> {t}
                </li>
              ))}
            </ul>
          </div>

          <Reveal className="site-card p-6 md:p-8">
            <form onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" error={errors.name} htmlFor="f-name">
                  <input id="f-name" className={inputCls} style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="name" />
                </Field>
                <Field label="E-mail profissional" error={errors.email} htmlFor="f-email">
                  <input id="f-email" type="email" className={inputCls} style={inputStyle} value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
                </Field>
                <Field label="WhatsApp com DDD" error={errors.whatsapp} htmlFor="f-phone">
                  <input id="f-phone" inputMode="tel" placeholder="(11) 99999-9999" className={inputCls} style={inputStyle} value={form.whatsapp} onChange={(e) => set('whatsapp', maskPhone(e.target.value))} aria-invalid={!!errors.whatsapp} />
                </Field>
                <Field label="Nome da empresa" error={errors.company} htmlFor="f-company">
                  <input id="f-company" className={inputCls} style={inputStyle} value={form.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!errors.company} autoComplete="organization" />
                </Field>
              </div>

              <fieldset className="mt-5">
                <legend className="mb-2 text-[13px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>Marketplaces utilizados</legend>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => {
                    const on = form.marketplaces.includes(c)
                    return (
                      <button type="button" key={c} onClick={() => set('marketplaces', on ? form.marketplaces.filter((x) => x !== c) : [...form.marketplaces, c])}
                        aria-pressed={on}
                        className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                        style={on ? { background: 'var(--s-blue)', color: '#fff', border: '1px solid var(--s-blue)' } : { background: 'var(--s-surface)', color: 'var(--s-ink-soft)', border: '1px solid var(--s-line-strong)' }}>
                        {c}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <Field label="Faixa de pedidos mensais" htmlFor="f-orders" className="mt-5">
                <select id="f-orders" className={inputCls} style={inputStyle} value={form.monthlyOrders} onChange={(e) => set('monthlyOrders', e.target.value)}>
                  <option value="">Selecione (opcional)</option>
                  {ORDER_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              <label className="mt-5 flex items-start gap-2.5 text-[13px]" style={{ color: 'var(--s-ink-soft)' }}>
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" aria-invalid={!!errors.consent} />
                <span>Concordo em ser contatado e com o tratamento dos meus dados conforme a <Link to="/privacidade" style={{ color: 'var(--s-blue-ink)', textDecoration: 'underline' }}>Política de Privacidade</Link>.</span>
              </label>
              {errors.consent && <p className="mt-1 text-[12px]" style={{ color: 'var(--s-rose)' }}>{errors.consent}</p>}

              {status === 'unconfigured' && (
                <p className="mt-4 flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(233,168,58,0.1)', border: '1px solid rgba(233,168,58,0.28)', color: '#7A5410' }}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>O envio automático ainda não está configurado neste ambiente. {contact.email ? <>Escreva para <a href={`mailto:${contact.email}`} style={{ textDecoration: 'underline' }}>{contact.email}</a>.</> : 'Configure LEADS_WEBHOOK_URL para ativar o recebimento.'}</span>
                </p>
              )}
              {status === 'error' && (
                <p className="mt-4 flex items-center gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(240,70,108,0.08)', border: '1px solid rgba(240,70,108,0.24)', color: 'var(--s-rose)' }}>
                  <AlertCircle className="h-4 w-4" /> Não foi possível enviar agora. Tente novamente em instantes.
                </p>
              )}

              <button type="submit" disabled={status === 'loading'} className="btn btn-primary mt-6 w-full" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
                {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <>Solicitar demonstração <ArrowRight className="h-4 w-4" /></>}
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
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[12px]" style={{ color: 'var(--s-rose)' }} role="alert">{error}</p>}
    </div>
  )
}
