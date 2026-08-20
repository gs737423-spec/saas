# Sessão — Revisão das migrations 018 e 019

Data: 2026-08-14

## Resultado

As migrations locais `018_security_hardening_phase2.sql` e `019_vtex_native_integration.sql` foram auditadas estaticamente e preparadas para aplicação manual controlada em staging. Foram criados pre-flights e verificadores somente leitura em `supabase/manual/`. Nenhum Supabase remoto, dado real, segredo ou arquivo `.env` foi acessado ou alterado.

## Antes e depois

- Antes: as migrations não eram atômicas; três helpers `SECURITY DEFINER` herdavam `search_path = public`; tabelas novas da 019 referenciavam conexão/pedido apenas por ID; não havia pacote separado de pre-flight/verify.
- Depois: `BEGIN/COMMIT` protege cada migration; helpers usam `pg_catalog, public` e grants mínimos; FKs compostas comprovam `company_id` e `provider` também nas relações operacionais legadas compatíveis; JSONs, níveis e quantidades têm checks; quatro scripts somente leitura cobrem pré-condições e invariantes finais.

## Motivo

Reduzir risco de aplicação parcial, sequestro de resolução de nomes, associação cross-tenant por escrita privilegiada e entrada de payload estruturalmente inválido antes de qualquer teste real em staging.

## Decisões

- Ordem obrigatória: 018, verificação 018, 019, verificação 019.
- Aplicação somente manual e inicialmente em staging.
- Qualquer estado parcial, conflito de tenant/provider, papel desconhecido ou identidade canônica duplicada exige parada e investigação.
- Logs de auditoria continuam sem FK para `companies`, preservando histórico após exclusão autorizada.

## Validação

- Revisão estática de SQL, dependências, RLS, grants, FKs, índices e riscos de dados existentes.
- `git diff --check` executado sem erro de whitespace.
- `npm run typecheck`: passou.
- `npm run security:service-role-scan`: passou.
- `npm run build`: passou fora do sandbox local.
- `npm run test:run`: 98/99 passaram; o teste preexistente de tamper OAuth Shopee falhou porque trocar o último caractere Base64URL pode produzir uma codificação textual diferente dos mesmos bytes. Não é regressão das migrations e não foi corrigido nesta sessão para evitar expansão de escopo.
- Execução real de SQL/RLS/RPC: pendente e deliberadamente fora do escopo.

## Próxima ação

Executar o pacote exclusivamente no SQL Editor do projeto de staging, respeitando os STOP CONDITIONS, guardar os resultados e reconciliar o histórico de migrations em uma etapa futura explicitamente autorizada.

## Status

SQL PACKAGE READY FOR STAGING REVIEW. NOT READY FOR PRODUCTION.
