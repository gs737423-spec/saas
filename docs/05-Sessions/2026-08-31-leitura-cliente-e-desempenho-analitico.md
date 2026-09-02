---
type: session
date: 2026-08-31
status: concluded-local
---

# Leitura do cliente e desempenho analítico

## Objetivo

Remover metadado técnico exposto ao cliente, impedir barras sobre números extensos e reduzir a demora na troca de filtro e seção.

## Evidências e causa

- O selo `DADO REAL` era criado somente por `Dashboard.tsx` e renderizado por `KPICards.tsx`.
- `RealMarketplaceBreakdown` reservava uma largura fixa para faturamento; valores longos podiam ultrapassá-la e cruzar a barra seguinte.
- `/api/dashboard/finance` carregava até 366 dias de pedidos para calcular quatro dias de comparação; Dashboard e Marketplaces recebiam o extrato inteiro sem o utilizar. Leituras repetidas do mesmo endpoint não tinham cache nem deduplicação.

## Alterações

- Removido o selo da interface do cliente.
- Reorganizadas as linhas com barras para separar valor, barra e percentual e permitir quebra segura.
- Adicionado cache curto, in-flight deduplication e invalidação por atualização de conexão, com chave isolada por usuário e URL/tenant.
- Financeiro passou a buscar somente D-0, D-1, D-7, D-30 e D-365 para crescimento; consumidores sem extrato enviam `include_transactions=false`.

## Validação

- `npm run typecheck`: passou.
- Testes focados: 16/16 passaram.
- `npm run build`: passou.

## Riscos e próxima ação

- Cache é local, dura 15 segundos e é invalidado em refresh de integração; não grava dados e não mistura tenants.
- Falta validação visual com sessão autenticada do cliente antes da publicação.

## Complemento — restauração visual do login

- O usuário rejeitou a composição enterprise do login. A versão imediatamente anterior foi restaurada como baseline visual, sem alterar regras de autenticação.
- TypeScript e build passaram após a restauração. A próxima ação é a aprovação visual humana em `/login`.

## Complemento — alinhamento da lista de GMV

- A coluna de faturamento agora é dimensionada uma vez a partir do maior valor renderizado no conjunto.
- Número, legenda `faturamento`, início da barra e percentual passam a compartilhar a mesma grade, inclusive quando um marketplace possui mais dígitos que os demais.

## Complemento — catálogos grandes e retorno às seções

- Diagnóstico read-only em 2026-09-01: a conexão VTEX possui 17.803 produtos e 17.803 estoques ativos; Produtos e Estoque percorriam também até 82.431 itens de pedido antes de responder, em páginas sequenciais.
- As leituras paginadas agora executam lotes pequenos em paralelo e as consultas independentes de cada endpoint são iniciadas juntas, mantendo tenant, filtros e conjunto de dados originais.
- Produtos e Estoque não persistem catálogos grandes no cache do navegador; as tabelas exibem páginas de 100 itens por vez, mantendo todos os itens, filtros e navegação acessíveis sem montar milhares de linhas no DOM. A paginação no servidor permanece como próxima etapa para reduzir o payload inicial.
- Respostas controladas de erro/configuração agora informam falha temporária de leitura e não sugerem reconectar um marketplace que pode continuar com dados sincronizados.

## Complemento — varredura VTEX OMS

- Confirmado por logs e checkpoint que o redutor de janela incremental persistiu 908 ms; OMS exige no mínimo 1 s e devolveu HTTP 400.
- Corrigidos o piso em cada redução, a normalização de checkpoint legado e a recuperação automática estritamente limitada a esse erro OMS conhecido.
- Nenhuma escrita de dado de negócio foi feita na auditoria. Catálogo/estoque e pedidos permanecem íntegros; a recuperação ocorre no próximo cron após deploy.

## Complemento — divergência de totais durante atualização VTEX

- A leitura de 2026-09-01 comprovou que o dashboard podia manter uma resposta de período aberto em cache enquanto uma execução VTEX incremental ainda trazia pedidos. O problema era de frescor/apresentação, não de soma ou de tenant cruzado.
- Incrementais passam a atualizar pedidos antes do catálogo; a carga full permanece conservadora. O cache de período aberto cai para 20 segundos e o de período fechado mantém cinco minutos.
- Nenhum dado real foi modificado durante a auditoria; o resultado exige validação após o próximo ciclo de pedidos em produção.

## Complemento — calendário analítico São Paulo

- A varredura de consistência encontrou agrupamento UTC divergente entre o resumo e as séries financeira/diária/produto. Pedidos entre 21h00 e 23h59 BRT podiam aparecer no dia seguinte apenas em parte da interface.
- Foi criado um helper único para chaves, limites e deslocamentos de data em `America/Sao_Paulo`, aplicado a essas três leituras. Não há migration nem escrita nos dados reais.
- Validação local: TypeScript passou e 29 testes focados passaram. Próxima ação: publicar e comparar os períodos fechados da interface com a origem VTEX.

## Complemento — snapshot único no Dashboard

- A divergência visual de setembro (KPI com R$ 30 mil/11 pedidos versus linhas GMV acima de R$ 900 mil) expôs que a Visão Geral combinava duas respostas independentes, sujeitas a cache e sincronização em momentos diferentes.
- A rota financeira passou a incluir os campos de KPI somente quando o Dashboard solicita; a página repassa exatamente essa mesma resposta ao ranking GMV. Não há mais segunda leitura de pedidos na Visão Geral.
- Validação local: TypeScript passou, 16/16 testes focados passaram e build passou. Smoke autenticado permanece pendente por ausência de sessão de cliente no ambiente de diagnóstico.

## Complemento — leituras pesadas da barra global

- A navegação global fazia uma leitura integral de Produtos para alertas de estoque, e a busca repetia a mesma leitura ao abrir. Em catálogo VTEX grande, essas chamadas competiam com a navegação mesmo fora de Produtos/Estoque.
- Alertas passaram a buscar somente seis itens críticos; busca virou consulta por termo, limitada a seis resultados e iniciada somente após dois caracteres.
- Essa é a redução imediata de carga. Produtos e Estoque ainda precisam de paginação e agregação no banco para eliminar a transferência do catálogo completo de suas próprias telas.

## Complemento — paginação no servidor para Produtos e Estoque

- A etapa estrutural foi implementada em 2026-09-02: `Produtos.tsx` e `Estoque.tsx` solicitam páginas de 100 registros, com filtros e ordenação enviados ao servidor.
- A migration `030_paged_catalog_dashboard_reads.sql` foi confirmada no Supabase. Ela cria dois índices de leitura e duas funções `security definer` sem permissão para `anon`/`authenticated`; apenas a API, via `service_role`, as executa após `requireCompany` resolver o tenant.
- Produtos agrega vendas do período e anterior, tendência, margem e participação por SKU no banco. Estoque agrega vendas de 30 dias, cobertura, giro e Curva ABC no banco. Os metadados retornam totais e categorias sem transferir o catálogo completo.
- Relatórios e Produto 360 continuam intencionalmente no contrato legado nesta entrega, para não reduzir seus dados silenciosamente. A migração deles para consultas estreitas permanece a próxima etapa.
- Validação local: `npm run typecheck` passou; 16/16 testes focados passaram. O build local iniciou `tsc && vite build`, mas a execução do ambiente não devolveu o encerramento completo do Vite; a validação definitiva ocorrerá no build de produção do deploy.
