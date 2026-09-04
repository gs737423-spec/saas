-- Prepara a estrutura de Produtos pra quando vendedores reais conectarem:
-- categoria vem do Mercado Livre (real, capturada no sync); custo é
-- SEMPRE informado pelo cliente (nenhum marketplace expõe o custo do
-- vendedor) — fica nulo até ele preencher, nunca inventado. Margem só
-- existe quando cost_price está setado.

alter table marketplace_products add column if not exists category_id text;
alter table marketplace_products add column if not exists category_name text;
alter table marketplace_products add column if not exists cost_price numeric;
