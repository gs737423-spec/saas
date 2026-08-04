-- Campos de contato/observação na empresa — painel admin precisa disso pra
-- ser útil de verdade (telefone/email de quem assinou o contrato, nota
-- livre tipo "plano X, fechado em DD/MM").
alter table companies add column if not exists contact_email text;
alter table companies add column if not exists contact_phone text;
alter table companies add column if not exists notes text;
