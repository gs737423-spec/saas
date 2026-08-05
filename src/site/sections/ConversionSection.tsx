import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertCircle, MessageCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { contact, ctaLabels, specialistHref } from '@/site/content'

type Status = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured'

type FormState = {
  name: string
  whatsapp: string
  company: string
  cnpj: string
  marketplaces: string[]
  message: string
  consent: boolean
}

const CHANNELS = ['Mercado Livre', 'Amazon', 'Shopee', 'Leroy Merlin', 'Outro']

const VALUE_POINTS = [
  'Consultoria estratégica combinada com tecnologia própria',
  'Time dedicado a operações multicanal',
  'Primeira conversa sem compromisso',
]

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.replace(/(\d{0,2})/, '($1')
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, '($1) $2')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

function maskCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const MESSAGE_MAX = 1500

// Conversão única — formulário curto e direto: só o que a equipe realmente
// precisa pra ligar de volta e já abrir o cadastro no painel admin (CNPJ é
// obrigatório aqui exatamente por isso). Empresa primeiro (é uma consultoria
// B2B — quem preenche já sabe que está falando em nome de uma operação),
// depois contato pessoal.
export default function ConversionSection() {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState<FormState>({ name: '', whatsapp: '', company: '', cnpj: '', marketplaces: [], message: '', consent: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const waHref = specialistHref('Olá! Gostaria de falar com um especialista da MKTOnline.')

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  function toggleMarketplace(m: string) {
    set('marketplaces', form.marketplaces.includes(m) ? form.marketplaces.filter((x) => x !== m) : [...form.marketplaces, m])
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.company.trim()) e.company = 'Informe o nome da empresa.'
    if (form.cnpj.replace(/\D/g, '').length !== 14) e.cnpj = 'Informe um CNPJ válido.'
    if (!form.name.trim()) e.name = 'Informe seu nome.'
    if (form.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Informe um WhatsApp com DDD.'
    if (!form.message.trim()) e.message = 'Conte o que você gostaria de tratar com a equipe.'
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
        <div className="site-container py-10 md:py-12">
          <Reveal className="vt-card mx-auto max-w-xl p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(120,202,255,0.14)', color: '#78CAFF' }}>
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="site-h3 mt-5 vt-ink">Pedido recebido!</h2>
            <p className="site-lead mt-3 vt-muted">Recebemos sua solicitação. Nossa equipe entrará em contato pelo WhatsApp informado.</p>
          </Reveal>
        </div>
      </section>
    )
  }

  return (
    <section id="conversao" className="sec-conversion scroll-mt-24">
      <span id="faq" aria-hidden="true" className="conversion-compat-anchor" />
      <div className="site-container py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <span className="site-label mb-2" style={{ color: '#78CAFF' }}>CONVERSA INICIAL</span>
            <h2 className="vt-ink text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">Vamos entender a operação do seu e‑commerce.</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed vt-muted">Conte um pouco sobre o seu cenário atual. Nossa equipe responde diretamente pelo WhatsApp.</p>

            <ul className="mt-5 flex flex-col gap-2.5">
              {VALUE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] leading-snug vt-muted">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#78CAFF' }} />
                  {point}
                </li>
              ))}
            </ul>

            {waHref.startsWith('http') && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold hover:underline" style={{ color: '#78CAFF' }}>
                <MessageCircle className="h-4 w-4" /> Prefere falar direto? Envie uma mensagem no WhatsApp
              </a>
            )}
          </div>

          <Reveal className="vt-card p-5 md:p-6 lg:col-span-7">
            <h3 className="text-[15px] font-bold vt-ink">Fale com um especialista</h3>
            <form onSubmit={onSubmit} noValidate className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome da empresa" error={errors.company} htmlFor="f-company">
                  <input id="f-company" className="vt-input" value={form.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!errors.company} autoComplete="organization" />
                </Field>
                <Field label="CNPJ" error={errors.cnpj} htmlFor="f-cnpj">
                  <input id="f-cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" className="vt-input" value={form.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))} aria-invalid={!!errors.cnpj} />
                </Field>
                <Field label="Seu nome" error={errors.name} htmlFor="f-name">
                  <input id="f-name" className="vt-input" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="name" />
                </Field>
                <Field label="WhatsApp com DDD" error={errors.whatsapp} htmlFor="f-phone">
                  <input id="f-phone" inputMode="tel" placeholder="(11) 99999-9999" className="vt-input" value={form.whatsapp} onChange={(e) => set('whatsapp', maskPhone(e.target.value))} aria-invalid={!!errors.whatsapp} />
                </Field>
              </div>

              <fieldset className="mt-3">
                <legend className="mb-1.5 text-[13px] font-semibold vt-muted">Em quais marketplaces sua empresa vende?</legend>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((c) => {
                    const on = form.marketplaces.includes(c)
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleMarketplace(c)}
                        aria-pressed={on}
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                        style={on
                          ? { background: '#275DFF', color: '#062229', border: '1px solid #275DFF' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(214,235,232,0.82)', border: '1px solid rgba(255,255,255,0.14)' }}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <Field label="O que você gostaria de tratar com a equipe?" error={errors.message} htmlFor="f-message" className="mt-3">
                <textarea
                  id="f-message"
                  rows={2}
                  maxLength={MESSAGE_MAX}
                  placeholder="Conte um pouco sobre sua operação e o que você está buscando."
                  className="vt-input resize-none"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  aria-invalid={!!errors.message}
                />
              </Field>

              <label className="mt-3 flex items-start gap-2.5 text-[12.5px] vt-muted">
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" aria-invalid={!!errors.consent} />
                <span>Concordo em ser contatado e com o tratamento dos meus dados conforme a <Link to="/privacidade" style={{ color: '#78CAFF', textDecoration: 'underline' }}>Política de Privacidade</Link>.</span>
              </label>
              {errors.consent && <p className="mt-1 text-[12px]" style={{ color: 'var(--s-rose)' }}>{errors.consent}</p>}

              {status === 'unconfigured' && (
                <p className="mt-3 flex items-start gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(233,168,58,0.12)', border: '1px solid rgba(233,168,58,0.3)', color: '#F0C572' }}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>O envio automático ainda não está configurado neste ambiente. {contact.email ? <>Escreva para <a href={`mailto:${contact.email}`} style={{ textDecoration: 'underline' }}>{contact.email}</a>.</> : 'Configure o SMTP de leads para ativar o recebimento.'}</span>
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 flex items-center gap-2 rounded-xl p-3 text-[13px]" style={{ background: 'rgba(240,70,108,0.12)', border: '1px solid rgba(240,70,108,0.3)', color: '#FF8FA6' }}>
                  <AlertCircle className="h-4 w-4" /> Não foi possível enviar agora. Tente novamente em instantes.
                </p>
              )}

              <button type="submit" disabled={status === 'loading'} className="btn btn-primary mt-4 w-full" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
                {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : ctaLabels.principal}
              </button>
              <p className="mt-2.5 text-center text-[11.5px] vt-muted">Retorno da equipe MKTOnline • Conversa inicial sem compromisso</p>
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
