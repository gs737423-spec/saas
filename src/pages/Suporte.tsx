import { useCallback, useEffect, useState } from 'react'
import { Loader2, LifeBuoy, Plus, X, Send, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import type { SupportTicket, SupportTicketDetail, SupportTicketPriority, SupportTicketStatus } from '@/server/integrations/types'

const statusLabel: Record<SupportTicketStatus, { label: string; color: string; bg: string; border: string }> = {
  aberto: { label: 'Aberto', color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/20' },
  em_andamento: { label: 'Em andamento', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  resolvido: { label: 'Resolvido', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  fechado: { label: 'Fechado', color: 'text-text-muted', bg: 'bg-white/5', border: 'border-border-subtle' },
}

const priorityLabel: Record<SupportTicketPriority, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Suporte() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    const res = await apiFetchJson<{ ok: boolean; tickets?: SupportTicket[] }>('/api/support/tickets')
    setTickets(res?.ok ? (res.tickets ?? []) : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (openTicketId) {
    return <TicketThread ticketId={openTicketId} onBack={() => { setOpenTicketId(null); loadTickets() }} />
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2.5 text-[13px] font-bold text-[#081423] shadow-lg shadow-accent-primary/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Novo chamado
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-xl p-10 text-center">
          <LifeBuoy className="h-8 w-8 text-text-muted" />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Nenhum chamado ainda</h2>
            <p className="mt-1 text-[13px] text-text-muted">Ficou com alguma dúvida ou encontrou um problema? Abra o primeiro chamado.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2.5 text-[13px] font-bold text-[#081423] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Abrir primeiro chamado
          </button>
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border-subtle overflow-hidden rounded-xl">
          {tickets.map((t) => {
            const st = statusLabel[t.status]
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setOpenTicketId(t.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-text-primary">{t.subject}</p>
                  <p className="mt-0.5 text-[11.5px] text-text-muted">{priorityLabel[t.priority]} · atualizado em {formatDate(t.updatedAt)}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={(ticketId) => { setShowCreate(false); setOpenTicketId(ticketId); }}
        />
      )}
    </div>
  )
}

function CreateTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ticketId: string) => void }) {
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<SupportTicketPriority>('normal')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triedSubmit, setTriedSubmit] = useState(false)

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTriedSubmit(true)
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetchJson<{ ok: boolean; ticket?: SupportTicketDetail; message?: string }>('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), priority, message: message.trim() }),
      })
      if (!res?.ok || !res.ticket) {
        setError(res?.message ?? 'Erro ao abrir chamado.')
        return
      }
      onCreated(res.ticket.id)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/45 focus:border-accent-primary/50 focus:outline-none'
  const labelClass = 'mb-1.5 block text-[11px] font-medium text-text-muted'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-text-primary">Novo chamado</h2>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-text-muted">Descreva sua dúvida ou problema — nossa equipe responde por aqui.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Assunto *</label>
            <input
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Pedido não sincronizou"
              maxLength={200}
              className={inputClass}
            />
            {triedSubmit && !subject.trim() && <p className="mt-1 text-[11px] text-accent-rose">Assunto é obrigatório.</p>}
          </div>
          <div>
            <label className={labelClass}>Prioridade</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as SupportTicketPriority)} className={inputClass}>
              {(Object.keys(priorityLabel) as SupportTicketPriority[]).map((p) => (
                <option key={p} value={p}>{priorityLabel[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Mensagem *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte o que está acontecendo..."
              rows={4}
              maxLength={10000}
              className={`${inputClass} resize-none`}
            />
            {triedSubmit && !message.trim() && <p className="mt-1 text-[11px] text-accent-rose">Mensagem não pode ficar vazia.</p>}
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-[12px] text-accent-rose">
              <XCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border-subtle px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-white/5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-accent-primary px-5 py-2.5 text-[13.5px] font-bold text-[#081423] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Abrir chamado
          </button>
        </div>
      </form>
    </div>
  )
}

function TicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (cancelledRef?: { cancelled: boolean }) => {
    const res = await apiFetchJson<{ ok: boolean; ticket?: SupportTicketDetail | null }>(`/api/support/tickets?id=${ticketId}`)
    if (cancelledRef?.cancelled) return
    setTicket(res?.ok ? (res.ticket ?? null) : null)
    setLoading(false)
  }, [ticketId])

  useEffect(() => {
    const ref = { cancelled: false }
    load(ref)
    return () => { ref.cancelled = true }
  }, [load])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await apiFetch('/api/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, message: reply.trim() }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; message?: string } | null
      if (!res.ok || !body?.ok) {
        setError(body?.message ?? 'Erro ao enviar mensagem.')
        return
      }
      setReply('')
      await load()
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-sm text-text-muted">Chamado não encontrado.</p>
      </div>
    )
  }

  const st = statusLabel[ticket.status]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-text-primary">{ticket.subject}</h1>
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
      </div>

      <div className="glass-panel flex flex-col gap-3 rounded-xl p-4">
        {ticket.messages.length === 0 && <p className="text-[13px] text-text-muted">Nenhuma mensagem ainda.</p>}
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.authorRole === 'admin' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-[13px] ${m.authorRole === 'admin' ? 'bg-white/5 text-text-primary' : 'bg-accent-primary/15 text-text-primary'}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[10.5px] text-text-muted">{m.authorRole === 'admin' ? 'Equipe' : 'Você'} · {formatDate(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== 'fechado' && (
        <form onSubmit={handleReply} className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva uma resposta..."
            rows={2}
            maxLength={10000}
            className="min-w-0 flex-1 resize-none rounded-lg border border-border-subtle bg-bg-primary/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/45 focus:border-accent-primary/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2.5 text-[13px] font-bold text-[#081423] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar
          </button>
        </form>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-[12px] text-accent-rose">
          <XCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      {ticket.status === 'fechado' && (
        <p className="flex items-center gap-1.5 text-[12px] text-text-muted">
          <CheckCircle2 className="h-3.5 w-3.5" /> Este chamado está fechado.
        </p>
      )}
    </div>
  )
}
