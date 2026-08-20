-- Comissão do marketplace por pedido — o Mercado Livre já manda
-- order_items[].sale_fee no payload do pedido (mapper.ts só não extraía).
-- Aditivo/reversível: coluna nova com default 0, nada existente muda de
-- forma. Base pro card "Taxas" do dashboard (hoje mock).

alter table orders add column if not exists fee_amount numeric not null default 0;
