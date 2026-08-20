-- Nova procedência de resolução: 'vtex_affiliate_registry'.
--
-- Contexto: a VTEX expõe (Marketplace API, endpoint de affiliates) o nome
-- real que o próprio vendedor cadastrou pra cada affiliateId (MLB, MZN, MLP,
-- ...) dentro do painel VTEX — dado de origem VTEX, não heurística sobre a
-- sigla. `autoResolveVtexAffiliatesFromRegistry` (channelRegistry.ts) usa
-- esse nome real pra casar automaticamente com um canal canônico já
-- conhecido (Mercado Livre, Amazon, Shopee, Magalu), sem exigir clique
-- manual do cliente — mas só quando o nome bate com um canônico existente;
-- caso contrário permanece 'unresolved' como antes. Nunca sobrescreve uma
-- linha já resolvida por 'mapping' (escolha explícita do usuário).
--
-- ADITIVA. Idempotente. Não remove nem altera nenhuma linha existente.

begin;

alter table public.vtex_channel_mappings
  drop constraint if exists vtex_channel_mappings_resolution_source_check;
alter table public.vtex_channel_mappings
  add constraint vtex_channel_mappings_resolution_source_check
  check (resolution_source is null or resolution_source in ('mapping', 'native_store', 'unresolved', 'vtex_affiliate_registry'));

commit;
