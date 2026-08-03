-- Campos reais coletados no cadastro — nada aqui é calculado/inventado,
-- status é decidido manualmente pela equipe (não um "health score" fake).
alter table companies add column if not exists cnpj text;
alter table companies add column if not exists whatsapp text;
alter table companies add column if not exists website text;
alter table companies add column if not exists status text not null default 'ativo'
  check (status in ('onboarding', 'ativo', 'em_risco', 'suspenso'));
