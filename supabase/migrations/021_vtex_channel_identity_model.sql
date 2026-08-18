-- Separação explícita entre CANAL CANÔNICO e IDENTIFICADOR BRUTO VTEX.
--
-- Contexto (validação em produção, conta VTEX real): a sincronização criava
-- um canal canônico (`sales_channels`) para CADA identificador bruto novo
-- (`affiliateId`/`salesChannel`: MLP, MZN, KBM, CMR, "1", ...), porque
-- `orders.sales_channel` tem FK para `sales_channels(company_id,
-- canonical_key)`. Resultado: dezenas/centenas de "marketplaces" fantasma e
-- uma segunda representação de Amazon convivendo com o canal Amazon real.
--
-- O código passa a resolver isso na origem (channelResolution.ts): nenhum
-- canônico é criado automaticamente e todo identificador não reconhecido cai
-- no balde único `external:vtex:unmapped`. Esta migration só dá ao banco as
-- colunas/índices que o novo modelo precisa.
--
-- ADITIVA. Idempotente. NÃO remove, não renomeia e não apaga nenhum dado —
-- inclusive os canais duplicados já criados, que ficam para um plano de
-- reparo separado, com autorização explícita.

begin;

-- ---------------------------------------------------------------------------
-- Identificador bruto: tipo + valor normalizado como colunas de primeira
-- classe (antes só existiam embutidos na string `external_key`, o que
-- obrigava a UI e as queries a parsear texto para agrupar/filtrar).
-- ---------------------------------------------------------------------------
alter table public.vtex_channel_mappings
  add column if not exists identifier_type text;
alter table public.vtex_channel_mappings
  add column if not exists identifier_value text;
-- Procedência da resolução — auditável. 'mapping' = escolha explícita do
-- usuário/configuração; 'native_store' = pedido sem identificador de
-- marketplace (fato estrutural da VTEX); 'unresolved' = ainda sem fonte
-- confiável. NUNCA existe uma procedência do tipo "heurística de sigla".
alter table public.vtex_channel_mappings
  add column if not exists resolution_source text;

-- Backfill derivado da `external_key`, que sempre existiu e é estável.
-- Normalizado com lower(btrim(...)) em toda comparação/extração para que
-- espaço acidental ou variação de caixa nunca produza uma segunda
-- identidade para o mesmo identificador bruto — inclusive no fallback
-- `unidentified`, onde "ABC" / "abc" / " abc " devem colapsar em um só.
update public.vtex_channel_mappings
set identifier_type = case
      when lower(btrim(external_key)) = 'native-store' then 'native_store'
      when lower(btrim(external_key)) = 'marketplace:unidentified' then 'unidentified'
      when lower(btrim(external_key)) like 'affiliate:%' then 'affiliate_id'
      when lower(btrim(external_key)) like 'sales-channel:%' then 'sales_channel'
      else 'unidentified'
    end,
    identifier_value = case
      when lower(btrim(external_key)) like 'affiliate:%' then lower(btrim(substring(lower(btrim(external_key)) from 11)))
      when lower(btrim(external_key)) like 'sales-channel:%' then lower(btrim(substring(lower(btrim(external_key)) from 15)))
      else lower(btrim(external_key))
    end
where identifier_type is null or identifier_value is null;

update public.vtex_channel_mappings
set resolution_source = case
      when lower(btrim(external_key)) = 'native-store' then 'native_store'
      when resolution_status = 'resolved' then 'mapping'
      else 'unresolved'
    end
where resolution_source is null;

alter table public.vtex_channel_mappings
  drop constraint if exists vtex_channel_mappings_identifier_type_check;
alter table public.vtex_channel_mappings
  add constraint vtex_channel_mappings_identifier_type_check
  check (identifier_type is null or identifier_type in ('affiliate_id', 'sales_channel', 'native_store', 'unidentified'));

alter table public.vtex_channel_mappings
  drop constraint if exists vtex_channel_mappings_resolution_source_check;
alter table public.vtex_channel_mappings
  add constraint vtex_channel_mappings_resolution_source_check
  check (resolution_source is null or resolution_source in ('mapping', 'native_store', 'unresolved'));

-- Dedupe do identificador bruto por (empresa, conexão, tipo, valor). A
-- unicidade por `external_key` já existia (migration 019) e continua sendo a
-- chave de conflito dos upserts — não mudamos essa estratégia. Este índice é
-- uma SEGUNDA barreira, não uma nova chave de negócio: usa
-- lower(btrim(identifier_value)) em vez do valor cru para que "MZN" /
-- "mzn" / " mzn " nunca colidam com identidades diferentes mesmo que um bug
-- futuro na aplicação esqueça de normalizar antes de gravar — o código atual
-- já normaliza (normalizeForComparison em channelResolution.ts), então esta
-- proteção é redundante hoje e existe só contra regressão.
create unique index if not exists vtex_channel_mappings_identifier_uidx
  on public.vtex_channel_mappings (company_id, connection_id, source_provider, identifier_type, (lower(btrim(identifier_value))))
  where identifier_type is not null and identifier_value is not null;

create index if not exists vtex_channel_mappings_company_canonical_idx
  on public.vtex_channel_mappings (company_id, canonical_channel, resolution_status);

-- ---------------------------------------------------------------------------
-- Canal canônico: chave de branding estável. Logo passa a ser resolvida por
-- `canonical_key` (via `logo_key`), nunca por display name — um canal
-- renomeado pelo usuário não pode perder a marca, e um identificador com
-- nome parecido não pode herdar a marca de outro.
-- ---------------------------------------------------------------------------
alter table public.sales_channels
  add column if not exists logo_key text;

update public.sales_channels
set logo_key = canonical_key
where logo_key is null
  and canonical_key in ('mercadolivre', 'amazon', 'shopee', 'magalu', 'loja_propria');

-- Balde único de identificadores ainda não reconhecidos, para as empresas
-- que já têm conexão VTEX. Ele já era criado indiretamente pelo sync; aqui
-- fica garantido de forma explícita, permitindo que `orders.sales_channel`
-- aponte para ele sem depender da ordem de execução.
insert into public.sales_channels (company_id, canonical_key, display_name, channel_type, status)
select distinct connections.company_id, 'external:vtex:unmapped', 'Canal não identificado', 'external', 'active'
from public.marketplace_connections connections
where connections.provider = 'vtex'
on conflict (company_id, canonical_key) do nothing;

-- Canais canônicos base, para que o usuário possa mapear um identificador
-- para "Amazon" mesmo antes de existir qualquer pedido de Amazon — e sempre
-- para a MESMA chave, nunca uma variação de escrita.
insert into public.sales_channels (company_id, canonical_key, display_name, channel_type, logo_key, status)
select distinct connections.company_id, base.canonical_key, base.display_name, base.channel_type, base.canonical_key, 'active'
from public.marketplace_connections connections
cross join (values
  ('mercadolivre', 'Mercado Livre', 'marketplace'),
  ('amazon', 'Amazon', 'marketplace'),
  ('shopee', 'Shopee', 'marketplace'),
  ('magalu', 'Magalu', 'marketplace'),
  ('loja_propria', 'Loja Própria', 'own_store')
) as base(canonical_key, display_name, channel_type)
where connections.provider = 'vtex'
on conflict (company_id, canonical_key) do nothing;

commit;
