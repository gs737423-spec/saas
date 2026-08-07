import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'
import type { SupportTicket, SupportMessage, SupportTicketStatus, SupportTicketPriority } from '../../src/server/integrations/types.js'

const STATUSES: SupportTicketStatus[] = ['aberto', 'em_andamento', 'resolvido', 'fechado']
const PRIORITIES: SupportTicketPriority[] = ['baixa', 'normal', 'alta', 'urgente']
// Só reabre a partir de "resolvido" — "fechado" é estado final do lado do
// cliente (Suporte.tsx esconde o formulário de resposta quando fechado; se
// reabrisse aqui também, a API aceitaria uma ação que a UI nunca oferece).
const REOPEN_ON_REPLY: SupportTicketStatus[] = ['resolvido']
const SUBJECT_MAX_LENGTH = 200
const MESSAGE_MAX_LENGTH = 10000

interface TicketRow {
  id: string
  company_id: string
  subject: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  created_by: string
  created_at: string
  updated_at: string
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
 * Suporte do lado do tenant: listar/criar tickets da própria empresa, ver
 * thread de um ticket e responder. Sempre via requireCompany — nunca aceita
 * company_id vindo do client, e todo lookup por ticketId revalida o dono
 * antes de aceitar leitura/escrita (impede tenant A adivinhar um UUID de
 * ticket do tenant B).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireCompany(req, res)
  if (!auth) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const id = typeof req.query.id === 'string' ? req.query.id : null

      if (id) {
        const { data: ticket, error: ticketError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', id)
          .eq('company_id', auth.companyId)
          .maybeSingle()
        if (ticketError) throw new Error(ticketError.message)
        if (!ticket) {
          res.status(404).json({ ok: false, ticket: null, message: 'Ticket não encontrado.' })
          return
        }

        const { data: messages, error: messagesError } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', id)
          .eq('company_id', auth.companyId)
          .order('created_at', { ascending: true })
        if (messagesError) throw new Error(messagesError.message)

        res.status(200).json({ ok: true, ticket: { ...mapTicket(ticket as TicketRow), messages: (messages ?? []).map((m) => mapMessage(m as MessageRow)) } })
        return
      }

      const status = typeof req.query.status === 'string' ? req.query.status : null
      let query = supabase.from('support_tickets').select('*').eq('company_id', auth.companyId).order('updated_at', { ascending: false })
      if (status && STATUSES.includes(status as SupportTicketStatus)) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true, tickets: (data ?? []).map((t) => mapTicket(t as TicketRow)) })
    } catch (err) {
      console.error('[api/support/tickets:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao carregar chamados de suporte.' })
    }
    return
  }

  if (req.method === 'POST') {
    if (!(await checkRateLimit(res, `support-create:${auth.user.id}`, 20, 1800))) return

    try {
      const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : ''
      const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
      const priorityInput = typeof req.body?.priority === 'string' ? req.body.priority : 'normal'
      const priority = PRIORITIES.includes(priorityInput as SupportTicketPriority) ? (priorityInput as SupportTicketPriority) : 'normal'

      if (!subject) {
        res.status(400).json({ ok: false, message: 'Assunto é obrigatório.' })
        return
      }
      if (subject.length > SUBJECT_MAX_LENGTH) {
        res.status(400).json({ ok: false, message: `Assunto muito longo (máximo ${SUBJECT_MAX_LENGTH} caracteres).` })
        return
      }
      if (!message) {
        res.status(400).json({ ok: false, message: 'Descreva sua dúvida ou problema na mensagem.' })
        return
      }
      if (message.length > MESSAGE_MAX_LENGTH) {
        res.status(400).json({ ok: false, message: `Mensagem muito longa (máximo ${MESSAGE_MAX_LENGTH} caracteres).` })
        return
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({ company_id: auth.companyId, subject, priority, created_by: auth.user.id })
        .select('*')
        .single()
      if (ticketError) throw new Error(ticketError.message)

      const { data: firstMessage, error: messageError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, company_id: auth.companyId, author_id: auth.user.id, author_role: 'cliente', body: message })
        .select('*')
        .single()
      if (messageError) {
        // Mensagem inicial falhou — desfaz o ticket em vez de devolver "sucesso"
        // com um chamado vazio (o cliente não tinha como saber que precisava
        // reenviar). Se o rollback também falhar, ainda assim reporta erro real
        // ao cliente (nunca 200/ok:true numa escrita que não completou).
        const { error: rollbackError } = await supabase.from('support_tickets').delete().eq('id', ticket.id)
        console.error('[api/support/tickets:POST] falha ao criar mensagem inicial', messageError, rollbackError ? { rollbackError } : undefined)
        res.status(500).json({ ok: false, message: 'Erro ao abrir chamado — tente novamente.' })
        return
      }

      res.status(200).json({ ok: true, ticket: { ...mapTicket(ticket as TicketRow), messages: [mapMessage(firstMessage as MessageRow)] } })
    } catch (err) {
      console.error('[api/support/tickets:POST]', err)
      res.status(500).json({ ok: false, message: 'Erro ao abrir chamado.' })
    }
    return
  }

  if (req.method === 'PATCH') {
    if (!(await checkRateLimit(res, `support-reply:${auth.user.id}`, 30, 1800))) return

    try {
      const ticketId = typeof req.body?.ticketId === 'string' ? req.body.ticketId : ''
      const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
      if (!ticketId) {
        res.status(400).json({ ok: false, message: 'ticketId é obrigatório.' })
        return
      }
      if (!message) {
        res.status(400).json({ ok: false, message: 'Mensagem não pode ficar vazia.' })
        return
      }
      if (message.length > MESSAGE_MAX_LENGTH) {
        res.status(400).json({ ok: false, message: `Mensagem muito longa (máximo ${MESSAGE_MAX_LENGTH} caracteres).` })
        return
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id, status')
        .eq('id', ticketId)
        .eq('company_id', auth.companyId)
        .maybeSingle()
      if (ticketError) throw new Error(ticketError.message)
      if (!ticket) {
        res.status(404).json({ ok: false, message: 'Ticket não encontrado.' })
        return
      }
      if (ticket.status === 'fechado') {
        res.status(409).json({ ok: false, message: 'Este chamado está fechado e não aceita novas mensagens.' })
        return
      }

      const { data: newMessage, error: messageError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, company_id: auth.companyId, author_id: auth.user.id, author_role: 'cliente', body: message })
        .select('*')
        .single()
      if (messageError) throw new Error(messageError.message)

      if (REOPEN_ON_REPLY.includes(ticket.status as SupportTicketStatus)) {
        // Condicional pelo status já lido (não um "sempre force em_andamento") —
        // se o admin mudou o status entre a leitura acima e este update (ex:
        // pra fechado), essa escrita não sobrescreve a decisão dele.
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ status: 'em_andamento' })
          .eq('id', ticketId)
          .eq('company_id', auth.companyId)
          .in('status', REOPEN_ON_REPLY)
        if (updateError) console.error('[api/support/tickets:PATCH] falha ao reabrir ticket', updateError)
      }

      res.status(200).json({ ok: true, message: mapMessage(newMessage as MessageRow) })
    } catch (err) {
      console.error('[api/support/tickets:PATCH]', err)
      res.status(500).json({ ok: false, message: 'Erro ao enviar mensagem.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
