-- Snapshot completo da consulta à Receita Federal (mesmo shape de CnpjInfo,
-- ver api/cnpj-lookup.ts) — inscrição estadual, CNAE, natureza jurídica,
-- capital social, endereço, sócios, situação cadastral. Vem junto do
-- cadastro (manual ou aprovação de solicitação) e nunca é fabricado: só
-- grava o que a Receita realmente devolveu.
alter table companies add column if not exists receita_data jsonb;
