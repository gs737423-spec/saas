import { useCallback, useEffect, useState } from 'react'
import { Loader2, LifeBuoy, X, Send, ShieldCheck, Settings } from 'lucide-react'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import EmptyState from '@/components/admin/EmptyState'
import type { SupportTicket, SupportTicketDetail, SupportTicketStatus } from '@/server/integrations/types'

const statusLabel: Record<SupportTicketStatus, { label: string; color: string; bg: string; border: string }> = {
  aberto: { label: 'Aberto', color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/20' },
  em_andamento: { label: 'Em andamento', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  resolvido: { label: 'Resolvido', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  fechado: { label: 'Fechado', color: 'text-text-muted', bg: 'bg-white/5', border: 'border-border-subtle' },
}

const STATUS_FILTERS: Array<SupportTicketStatus | 'todos'> = ['todos', 'aberto', 'em_andamento', 'resolvido', 'fechado']

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [configMissing, setConfigMissing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'todos'>('todos')
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

  // 403 (not_admin) é o único caso que mostra "Acesso restrito" — erro de
  // rede/cold start não pode virar essa mensagem pra um admin de verdade.
  // 1 retry automático antes de desistir (mesmo padrão de Admin.tsx).
  const loadTickets = useCallback(async (isRetry = false) => {
    const query = statusFilter === 'todos' ? '' : `?status=${statusFilter}`
    try {
      const res = await apiFetch(`/api/admin/support-tickets${query}`)
      if (res.status === 403) {
        setUnauthorized(true)
        setLoadError(false)
        setConfigMissing(false)
        setLoading(false)
        return
      }
      if (res.status === 503) {
        setConfigMissing(true)
        setLoading(false)
        return
      }
      const body = (await res.json().catch(() => null)) as { ok: boolean; tickets?: SupportTicket[] } | null
      if (res.ok && body?.ok) {
        setTickets(body.tickets ?? [])
        setUnauthorized(false)
        setLoadError(false)
        setConfigMissing(false)
        setLoading(false)
        return
      }
      throw new Error('unexpected_response')
    } catch {
      if (!isRetry) {
        await new Promise((r) => setTimeout(r, 800))
        return loadTickets(true)
      }
      setLoadError(true)
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (configMissing) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Configuração pendente</h2>
        <p className="mt-1.5 text-sm text-text-muted">O servidor ainda não tem as variáveis do Supabase configuradas.</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-accent-rose" />
        <h2 className="text-base font-semibold text-text-primary">Acesso restrito</h2>
        <p className="mt-1.5 text-sm text-text-muted">Esta área é só para a equipe interna.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="glass-panel mx-auto mt-12 max-w-md rounded-xl p-6 text-center">
        <Settings className="mx-auto mb-3 h-8 w-8 text-accent-amber" />
        <h2 className="text-base font-semibold text-text-primary">Não foi possível carregar</h2>
        <p className="mt-1.5 text-sm text-text-muted">Falha de conexão ao verificar seu acesso. Tente novamente.</p>
        <button
          type="button"
          onClick={() => { setLoading(true); setLoadError(false); loadTickets() }}
          className="mt-3 rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Suporte</h1>
        <p className="text-[13px] text-text-muted">Chamados de todas as empresas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              statusFilter === s ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary' : 'border-border-subtle text-text-secondary hover:bg-white/5'
            }`}
          >
            {s === 'todos' ? 'Todos' : statusLabel[s].label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="Nenhum chamado" subtitle="Nenhum chamado bate com esse filtro." />
      ) : (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Assunto</th>
                <th className="px-4 py-3 font-semibold">Prioridade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tickets.map((t) => {
                const st = statusLabel[t.status]
                return (
                  <tr key={t.id} className="cursor-pointer transition-colors hover:bg-white/[0.03]" onClick={() => setActiveTicketId(t.id)}>
                    <td className="px-4 py-3 text-[13px] text-text-primary">{t.companyName ?? '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-[13px] text-text-primary">{t.subject}</td>
                    <td className="px-4 py-3 text-[13px] capitalize text-text-secondary">{t.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${st.color} ${st.bg} ${st.border}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-muted">{formatDate(t.updatedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTicketId && (
        <TicketModal
          ticketId={activeTicketId}
          onClose={() => { setActiveTicketId(null); loadTickets() }}
        />
      )}
    </div>
  )
}

function TicketModal({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (cancelledRef?: { cancelled: boolean }) => {
    const res = await apiFetchJson<{ ok: boolean; ticket?: SupportTicketDetail | null }>(`/api/admin/support-tickets?id=${ticketId}`)
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
      const res = await apiFetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', ticketId, message: reply.trim() }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; message?: string } | null
      if (!res.ok || !body?.ok) {
        setError(body?.message ?? 'Erro ao enviar resposta.')
        return
      }
      setReply('')
      await load()
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(status: SupportTicketStatus) {
    setUpdatingStatus(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', ticketId, status }),
      })
      const body = (await res.json().catch(() => null)) as { ok: boolean; message?: string } | null
      if (!res.ok || !body?.ok) {
        setError(body?.message ?? 'Erro ao mudar status.')
        return
      }
      await load()
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="glass-panel flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {loading || !ticket ? (
          <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-text-primary">{ticket.subject}</h2>
                <p className="text-[12px] text-text-muted">{ticket.companyName ?? ticket.companyId}</p>
              </div>
              <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Status:</span>
              <select
                value={ticket.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as SupportTicketStatus)}
                className="rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5 text-[12px] text-text-primary focus:border-accent-primary/50 focus:outline-none"
              >
                {(Object.keys(statusLabel) as SupportTicketStatus[]).map((s) => (
                  <option key={s} value={s}>{statusLabel[s].label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-border-subtle bg-bg-primary/20 p-4">
              {ticket.messages.length === 0 && <p className="text-[13px] text-text-muted">Nenhuma mensagem ainda.</p>}
              {ticket.messages.map((m) => (
                <div key={m.id} className={`flex ${m.authorRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-[13px] ${m.authorRole === 'admin' ? 'bg-accent-primary/15 text-text-primary' : 'bg-white/5 text-text-primary'}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[10.5px] text-text-muted">{m.authorRole === 'admin' ? 'Equipe' : 'Cliente'} · {formatDate(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {ticket.status === 'fechado' ? (
              <p className="mt-4 rounded-lg border border-border-subtle bg-bg-primary/20 px-3 py-2.5 text-[12.5px] text-text-muted">
                Chamado fechado — o cliente não pode mais responder aqui. Mude o status acima antes de enviar uma nova mensagem.
              </p>
            ) : (
              <form onSubmit={handleReply} className="mt-4 flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Responder ao cliente..."
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
            {error && <p className="mt-2 text-[12px] text-accent-rose">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
