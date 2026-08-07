import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'
import type { SupportTicket, SupportMessage, SupportTicketStatus } from '../../src/server/integrations/types.js'

const STATUSES: SupportTicketStatus[] = ['aberto', 'em_andamento', 'resolvido', 'fechado']
const MESSAGE_MAX_LENGTH = 10000

interface TicketRow {
  id: string
  company_id: string
  subject: string
  status: SupportTicketStatus
  priority: SupportTicket['priority']
  created_by: string
  created_at: string
  updated_at: string
  companies?: { name: string } | null
}

interface MessageRow {
  id: string
  ticket_id: string
  author_id: string
  author_role: 'cliente' | 'admin'
  body: string
  created_at: string
}

function mapTicket(t: TicketRow): SupportTicket {
  return {
    id: t.id,
    companyId: t.company_id,
    companyName: t.companies?.name,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdBy: t.created_by,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}

function mapMessage(m: MessageRow): SupportMessage {
  return {
    id: m.id,
    ticketId: m.ticket_id,
    authorId: m.author_id,
    authorRole: m.author_role,
    body: m.body,
    createdAt: m.created_at,
  }
}

/**
 * Suporte do lado admin: vê e responde tickets de TODAS as empresas.
 * Isolado atrás de requireAdmin — nunca reaproveitado por rota de cliente
 * (o equivalente tenant-scoped é api/support/tickets.ts).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const id = typeof req.query.id === 'string' ? req.query.id : null

      if (id) {
        const { data: ticket, error: ticketError } = await supabase.from('support_tickets').select('*, companies(name)').eq('id', id).maybeSingle()
        if (ticketError) throw new Error(ticketError.message)
        if (!ticket) {
          res.status(404).json({ ok: false, ticket: null, message: 'Ticket não encontrado.' })
          return
        }

        const { data: messages, error: messagesError } = await supabase.from('support_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
        if (messagesError) throw new Error(messagesError.message)

        res.status(200).json({ ok: true, ticket: { ...mapTicket(ticket as TicketRow), messages: (messages ?? []).map((m) => mapMessage(m as MessageRow)) } })
        return
      }

      const status = typeof req.query.status === 'string' ? req.query.status : null
      const companyId = typeof req.query.company_id === 'string' ? req.query.company_id : null

      let query = supabase.from('support_tickets').select('*, companies(name)').order('updated_at', { ascending: false })
      if (status && STATUSES.includes(status as SupportTicketStatus)) query = query.eq('status', status)
      if (companyId) query = query.eq('company_id', companyId)

      const { data, error } = await query
      if (error) throw new Error(error.message)

      const tickets = (data ?? []).map((t) => mapTicket(t as TicketRow))
      const openCount = tickets.filter((t) => t.status === 'aberto').length

      res.status(200).json({ ok: true, tickets, openCount })
    } catch (err) {
      console.error('[api/admin/support-tickets:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao listar chamados de suporte.' })
    }
    return
  }

  if (req.method === 'PATCH') {
    if (!(await checkRateLimit(res, `support-admin-reply:${admin.user.id}`, 60, 1800))) return

    try {
      const action = typeof req.body?.action === 'string' ? req.body.action : ''
      const ticketId = typeof req.body?.ticketId === 'string' ? req.body.ticketId : ''
      if (!ticketId) {
        res.status(400).json({ ok: false, message: 'ticketId é obrigatório.' })
        return
      }

      const { data: ticket, error: ticketError } = await supabase.from('support_tickets').select('id, company_id, status').eq('id', ticketId).maybeSingle()
      if (ticketError) throw new Error(ticketError.message)
      if (!ticket) {
        res.status(404).json({ ok: false, message: 'Ticket não encontrado.' })
        return
      }

      if (action === 'reply') {
        const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
        if (!message) {
          res.status(400).json({ ok: false, message: 'Mensagem não pode ficar vazia.' })
          return
        }
        if (message.length > MESSAGE_MAX_LENGTH) {
          res.status(400).json({ ok: false, message: `Mensagem muito longa (máximo ${MESSAGE_MAX_LENGTH} caracteres).` })
          return
        }
        // Ticket fechado é estado final — reabrir exige mudar o status
        // explicitamente (action:'status') antes de responder, senão a
        // mensagem fica "encalhada" numa conversa que o cliente não pode
        // mais continuar (Suporte.tsx esconde o formulário quando fechado).
        if (ticket.status === 'fechado') {
          res.status(409).json({ ok: false, message: 'Chamado fechado — mude o status antes de responder.' })
          return
        }

        const { data: newMessage, error: messageError } = await supabase
          .from('support_messages')
          .insert({ ticket_id: ticketId, company_id: ticket.company_id, author_id: admin.user.id, author_role: 'admin', body: message })
          .select('*')
          .single()
        if (messageError) throw new Error(messageError.message)

        const { error: touchError } = await supabase.from('support_tickets').update({ status: 'em_andamento' }).eq('id', ticketId).in('status', ['aberto'])
        if (touchError) console.error('[api/admin/support-tickets:PATCH] falha ao marcar em_andamento', touchError)

        res.status(200).json({ ok: true, message: mapMessage(newMessage as MessageRow) })
        return
      }

      if (action === 'status') {
        const status = typeof req.body?.status === 'string' ? req.body.status : ''
        if (!STATUSES.includes(status as SupportTicketStatus)) {
          res.status(400).json({ ok: false, message: 'Status inválido.' })
          return
        }

        const { data: updated, error: updateError } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId).select('*, companies(name)').single()
        if (updateError) throw new Error(updateError.message)

        res.status(200).json({ ok: true, ticket: mapTicket(updated as TicketRow) })
        return
      }

      res.status(400).json({ ok: false, message: 'action deve ser "reply" ou "status".' })
    } catch (err) {
      console.error('[api/admin/support-tickets:PATCH]', err)
      res.status(500).json({ ok: false, message: 'Erro ao processar chamado.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
