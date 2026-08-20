# Sessão — Correção final source/channel das migrations

Data: 2026-08-14

## Resultado

Migration 019, classifier VTEX, identidade canônica e scripts manuais foram alinhados para separar source provider de sales channel. Magalu permanece explícita e VTEX desconhecida não contamina analytics. A migration 018 foi apenas revalidada e não mudou nesta passagem.

## Correções

- Removido o fallback universal `ELSE 'loja_propria'` do backfill.
- Providers diretos mapeiam explicitamente para o próprio canal, incluindo Magalu.
- VTEX sem resolução usa `unknown_marketplace`, fica fora dos analytics e recebe `VTEX_CHANNEL_MAPPING_REQUIRED`.
- Mapping VTEX aceita Magalu sem heurística por texto e preserva mapping existente quando a UI envia somente outros canais.
- Identidade `magalu:{marketplaceOrderId}` é igual para VTEX e futuro conector direto.
- Teste OAuth passou a alterar bytes reais de payload/assinatura e cobre expiração/malformação; produção não foi alterada.

## Limites

Nenhuma UI, integração direta Magalu, credencial, cron, migration remota, dado real, commit, stage ou push foi criado/executado.

## Validação

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:run`: 105/105 PASS.
- `npm.cmd run test:security`: 60/60 PASS.
- `npm.cmd run security:service-role-scan`: PASS.
- `npm.cmd run security:check`: PASS.
- `npm.cmd run build`: PASS via gate agregado, 1.929 módulos.
- `git diff --check`: PASS (nenhum erro de whitespace; apenas avisos informativos de conversão LF/CRLF no Windows).

## Feedback classificado

- Classificação: regra de projeto e antipadrão preventivo.
- Feedback: Magalu não pode cair em Loja Própria e VTEX não é necessariamente o canal da venda.
- Causa: o backfill anterior confundia source provider com dimensão analítica de canal.
- Regra derivada: provider desconhecido nunca recebe `loja_propria`; somente evidência positiva classifica Loja Própria.
- Teste preventivo: bloquear `ELSE 'loja_propria'`, testar todos os canais, unresolved e identidade Magalu direta/VTEX.
- Aprendizado proposto: generalizar a regra source ≠ channel para integrações agregadoras futuras. Não promovido à memória oficial do Venture OS.

## Próxima ação

Executar SQL A/B/E/C/D/F exclusivamente no pre-flight de staging, em ordem, após aprovação separada.
