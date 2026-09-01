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
