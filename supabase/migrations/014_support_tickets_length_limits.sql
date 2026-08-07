-- Limite de tamanho em support_tickets.subject e support_messages.body —
-- faltava na 013 (validação só existia na API, não no banco). Sem isso um
-- usuário autenticado podia inflar a tabela com payload de tamanho
-- arbitrário por linha (rate limit só limita contagem de requests, não
-- tamanho). Mesmos limites já aplicados em api/support/tickets.ts e
-- api/admin/support-tickets.ts (SUBJECT_MAX_LENGTH=200, MESSAGE_MAX_LENGTH=10000).

alter table support_tickets drop constraint if exists support_tickets_subject_length;
alter table support_tickets add constraint support_tickets_subject_length check (char_length(subject) <= 200);

alter table support_messages drop constraint if exists support_messages_body_length;
alter table support_messages add constraint support_messages_body_length check (char_length(body) <= 10000);
