import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertCircle, MessageCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { contact, ctaLabels, specialistHref } from '@/site/content'

type CnpjCheckStatus = 'idle' | 'loading' | 'matched' | 'mismatch' | 'not_found' | 'unavailable'

/** Espelha CnpjInfo de api/cnpj-lookup.ts — duplicado de propósito (tipo
 *  leve, mesmo padrão dos mappers de integração) em vez de importar de
 *  api/** direto no bundle do site. */
interface CnpjInfo {
  razaoSocial: string | null
  nomeFantasia: string | null
  situacaoCadastral: string | null
  dataSituacaoCadastral: string | null
  dataInicioAtividade: string | null
  atividadePrincipal: string | null
  cnaeCodigo: string | null
  cnaesSecundarios: string[]
  naturezaJuridica: string | null
  porte: string | null
  capitalSocial: number | null
  telefone: string | null
  email: string | null
  endereco: string | null
  matrizFilial: string | null
  simplesNacional: string | null
  socios: string[]
}

interface CnpjCheckState {
  status: CnpjCheckStatus
  info: CnpjInfo | null
}

const IDLE_CNPJ_CHECK: CnpjCheckState = { status: 'idle', info: null }

/** minúsculo, sem acento, sem sufixo de tipo societário — pra comparar
 *  "Acme Comercio LTDA" digitado pelo usuário com "ACME COMERCIO LTDA" (ou
 *  só "Acme") devolvido pela Receita sem falso-negativo por causa de
 *  maiúscula/abreviação/pontuação. */
function normalizeCompanyName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(ltda|me|eireli|epp|s\/a|sa|s\.a\.?)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function namesMatch(typed: string, razaoSocial: string | null, nomeFantasia: string | null): boolean {
  const t = normalizeCompanyName(typed)
  if (!t) return false
  const candidates = [razaoSocial, nomeFantasia].filter((v): v is string => !!v).map(normalizeCompanyName)
  return candidates.some((c) => c.includes(t) || t.includes(c))
}

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

// Cor de marca por canal (mesmas do resto da plataforma pra Mercado
// Livre/Amazon/Shopee via getMarketplaceColor; Leroy Merlin e "Outro" não
// existem nesse helper — cor própria aqui). text = cor do texto/ícone em
// cima do fundo da marca (amarelo do ML precisa de texto escuro).
const CHANNELS: { label: string; bg: string; text: string }[] = [
  { label: 'Mercado Livre', bg: '#FFE600', text: '#3D3200' },
  { label: 'Amazon', bg: '#FF9900', text: '#3D2400' },
  { label: 'Shopee', bg: '#EE4D2D', text: '#FFFFFF' },
  { label: 'Leroy Merlin', bg: '#78BE20', text: '#0D2400' },
  { label: 'Outro', bg: '#5F6B7A', text: '#FFFFFF' },
]

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
  const [cnpjCheck, setCnpjCheck] = useState<CnpjCheckState>(IDLE_CNPJ_CHECK)
  const cnpjCheckSeq = useRef(0)
  const waHref = specialistHref('Olá! Gostaria de falar com um especialista da MKTOnline.')

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  // Consulta a Receita assim que o CNPJ completa 14 dígitos, com debounce —
  // e reconsulta o "bate com o nome?" sempre que o nome da empresa muda
  // depois, sem precisar reconsultar a Receita de novo.
  useEffect(() => {
    const digits = form.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) {
      setCnpjCheck(IDLE_CNPJ_CHECK)
      return
    }
    const seq = ++cnpjCheckSeq.current
    setCnpjCheck({ status: 'loading', info: null })
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/cnpj-lookup?cnpj=${digits}`)
        const data = await res.json().catch(() => null)
        if (seq !== cnpjCheckSeq.current) return // resposta de uma consulta antiga, ignora
        if (data?.found === false) {
          setCnpjCheck({ status: 'not_found', info: null })
        } else if (data?.ok && data?.found) {
          const info: CnpjInfo = {
            razaoSocial: data.razaoSocial ?? null,
            nomeFantasia: data.nomeFantasia ?? null,
            situacaoCadastral: data.situacaoCadastral ?? null,
            dataSituacaoCadastral: data.dataSituacaoCadastral ?? null,
            dataInicioAtividade: data.dataInicioAtividade ?? null,
            atividadePrincipal: data.atividadePrincipal ?? null,
            cnaeCodigo: data.cnaeCodigo ?? null,
            cnaesSecundarios: Array.isArray(data.cnaesSecundarios) ? data.cnaesSecundarios : [],
            naturezaJuridica: data.naturezaJuridica ?? null,
            porte: data.porte ?? null,
            capitalSocial: data.capitalSocial ?? null,
            telefone: data.telefone ?? null,
            email: data.email ?? null,
            endereco: data.endereco ?? null,
            matrizFilial: data.matrizFilial ?? null,
            simplesNacional: data.simplesNacional ?? null,
            socios: Array.isArray(data.socios) ? data.socios : [],
          }
          const matched = namesMatch(form.company, info.razaoSocial, info.nomeFantasia)
          setCnpjCheck({ status: matched ? 'matched' : 'mismatch', info })
        } else {
          setCnpjCheck({ status: 'unavailable', info: null })
        }
      } catch {
        if (seq === cnpjCheckSeq.current) setCnpjCheck({ status: 'unavailable', info: null })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cnpj])

  // Nome mudou depois do CNPJ já ter sido consultado — reavalia o match sem
  // bater na Receita de novo (já temos os dados em mãos).
  useEffect(() => {
    if (cnpjCheck.status !== 'matched' && cnpjCheck.status !== 'mismatch') return
    const matched = namesMatch(form.company, cnpjCheck.info?.razaoSocial ?? null, cnpjCheck.info?.nomeFantasia ?? null)
    setCnpjCheck((c) => (c.status === (matched ? 'matched' : 'mismatch') ? c : { ...c, status: matched ? 'matched' : 'mismatch' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.company])

  function toggleMarketplace(m: string) {
    set('marketplaces', form.marketplaces.includes(m) ? form.marketplaces.filter((x) => x !== m) : [...form.marketplaces, m])
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.company.trim()) e.company = 'Informe o nome da empresa.'
    if (form.cnpj.replace(/\D/g, '').length !== 14) e.cnpj = 'Informe um CNPJ válido.'
    else if (cnpjCheck.status === 'loading') e.cnpj = 'Aguarde a confirmação do CNPJ.'
    else if (cnpjCheck.status === 'mismatch') e.company = `O nome não bate com o CNPJ (Receita: ${cnpjCheck.info?.razaoSocial ?? cnpjCheck.info?.nomeFantasia}).`
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
        body: JSON.stringify({ ...form, marketplaces: form.marketplaces.join(', '), cnpjInfo: cnpjCheck.info }),
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
      <div className="site-container py-6 md:py-8">
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <span className="site-label mb-1.5" style={{ color: '#78CAFF' }}>CONVERSA INICIAL</span>
            <h2 className="vt-ink text-[24px] font-extrabold leading-tight tracking-tight md:text-[28px]">Vamos entender a operação do seu e‑commerce.</h2>
            <p className="mt-2 text-[14px] leading-relaxed vt-muted">Conte um pouco sobre o seu cenário atual. Nossa equipe responde diretamente pelo WhatsApp.</p>

            <ul className="mt-3.5 flex flex-col gap-2">
              {VALUE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] leading-snug vt-muted">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#78CAFF' }} />
                  {point}
                </li>
              ))}
            </ul>

            {waHref.startsWith('http') && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-3.5 inline-flex items-center gap-2 text-[13.5px] font-semibold hover:underline" style={{ color: '#78CAFF' }}>
                <MessageCircle className="h-4 w-4" /> Prefere falar direto? Envie uma mensagem no WhatsApp
              </a>
            )}
          </div>

          <Reveal className="vt-card p-4 md:p-5 lg:col-span-7">
            <h3 className="text-[15px] font-bold vt-ink">Fale com um especialista</h3>
            <form onSubmit={onSubmit} noValidate className="mt-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="Nome da empresa" error={errors.company} htmlFor="f-company">
                  <input id="f-company" className="vt-input" value={form.company} onChange={(e) => set('company', e.target.value)} aria-invalid={!!errors.company} autoComplete="organization" />
                </Field>
                <Field label="CNPJ" error={errors.cnpj} htmlFor="f-cnpj">
                  <input id="f-cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" className="vt-input" value={form.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))} aria-invalid={!!errors.cnpj} />
                  {cnpjCheck.status === 'loading' && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] vt-muted"><Loader2 className="h-3 w-3 animate-spin" /> Confirmando CNPJ na Receita Federal...</p>
                  )}
                  {cnpjCheck.status === 'matched' && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px]" style={{ color: '#78E0A8' }}><CheckCircle2 className="h-3 w-3" /> {cnpjCheck.info?.razaoSocial ?? cnpjCheck.info?.nomeFantasia}</p>
                  )}
                  {cnpjCheck.status === 'unavailable' && (
                    <p className="mt-1 text-[11.5px] vt-muted">Não foi possível confirmar agora — você pode continuar.</p>
                  )}
                  {cnpjCheck.status === 'not_found' && !errors.cnpj && (
                    <p className="mt-1 text-[11.5px]" style={{ color: '#F0C572' }}>
                      CNPJ não encontrado na Receita Federal (pode ser recém-aberto — a base às vezes demora a atualizar). Você pode enviar mesmo assim, ou{' '}
                      <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ color: '#78CAFF', textDecoration: 'underline' }}>falar com a gente pelo WhatsApp</a>.
                    </p>
                  )}
                  {cnpjCheck.status === 'mismatch' && !errors.company && (
                    <p className="mt-1 text-[11.5px]" style={{ color: '#F0C572' }}>Nome não bate com a Receita: {cnpjCheck.info?.razaoSocial ?? cnpjCheck.info?.nomeFantasia}.</p>
                  )}
                </Field>
                <Field label="Seu nome" error={errors.name} htmlFor="f-name">
                  <input id="f-name" className="vt-input" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} autoComplete="name" />
                </Field>
                <Field label="WhatsApp com DDD" error={errors.whatsapp} htmlFor="f-phone">
                  <input id="f-phone" inputMode="tel" placeholder="(11) 99999-9999" className="vt-input" value={form.whatsapp} onChange={(e) => set('whatsapp', maskPhone(e.target.value))} aria-invalid={!!errors.whatsapp} />
                </Field>
              </div>

              <fieldset className="mt-2.5">
                <legend className="mb-1 text-[13px] font-semibold vt-muted">Em quais marketplaces sua empresa vende?</legend>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((c) => {
                    const on = form.marketplaces.includes(c.label)
                    return (
                      <button
                        type="button"
                        key={c.label}
                        onClick={() => toggleMarketplace(c.label)}
                        aria-pressed={on}
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                        style={on
                          ? { background: c.bg, color: c.text, border: `1px solid ${c.bg}` }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(214,235,232,0.82)', border: '1px solid rgba(255,255,255,0.14)' }}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <Field label="O que você gostaria de tratar com a equipe?" error={errors.message} htmlFor="f-message" className="mt-2.5">
                <textarea
                  id="f-message"
                  rows={1}
                  maxLength={MESSAGE_MAX}
                  placeholder="Conte um pouco sobre sua operação e o que você está buscando."
                  className="vt-input resize-none"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  aria-invalid={!!errors.message}
                />
              </Field>

              <label className="mt-2.5 flex items-start gap-2.5 text-[12.5px] vt-muted">
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

              <button type="submit" disabled={status === 'loading'} className="btn btn-primary mt-3 w-full" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
                {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : ctaLabels.principal}
              </button>
              <p className="mt-2 text-center text-[11.5px] vt-muted">Retorno da equipe MKTOnline • Conversa inicial sem compromisso</p>
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
