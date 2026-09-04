---
type: session
project: SaaS E-commerce
date: 2026-09-04
status: published-awaiting-vercel-confirmation
---

# Financeiro VTEX — enriquecimento de reembolsos

## Evidência

- A tela Financeiro recebia faturamento bruto, mas todos os pedidos VTEX eram persistidos com `fee_status='unknown'` e `refund_status='unknown'`.
- O endpoint OMS de transação de pagamento não oferece comissão/taxa ou refund confirmado; o Payments Gateway oficial oferece `totalRefunds`, em centavos, e requer `PCI Gateway / View Payment Data`.
- Nenhum cálculo de taxa, cancelamento ou ausência de resposta foi tratado como reembolso.

## Implementação

- `VtexOrder.paymentData.transactions` passa a fornecer IDs de transação ativos e deduplicados.
- O conector consulta o Payments Gateway apenas para pedidos pagos dos últimos 90 dias; `totalRefunds` explícito vira snapshot conhecido e valores ausentes continuam desconhecidos.
- Erro 403 desativa a tentativa adicional apenas na execução atual, registra evento sanitizado e não degrada a sincronização de pedidos.
- A leitura não é disparada por filtros, troca de tela ou navegador; acontece no worker de sincronização, dentro da mesma empresa/conexão.

## Limitação real

Comissões/taxas dos marketplaces que chegam via VTEX não estão presentes no contrato de pedidos nem no gateway de pagamentos. Portanto, o valor líquido continua indisponível até existir uma fonte financeira de liquidação do canal (por exemplo, conexão OAuth direta ou relatório financeiro compatível). Não foi criada estimativa.

## Validação

- `npm run typecheck`: passou.
- Testes focados: 22/22 passaram.
- Suíte completa: 355 passaram; 2 falhas em testes estáticos existentes que esperam o contrato anterior de `Financeiro.tsx` e query direta em `finance-daily.ts`, enquanto esses arquivos já usam paginação/RPC.
- `npm run build`: concluiu sem saída de erro.
- `git diff --check`: passou.
- Migration `034_preserve_confirmed_order_financial_snapshots.sql`: aplicada no Supabase vinculado em 2026-09-04.
- Commit `e762549` enviado para `origin/main`; o deploy automático da Vercel foi acionado. A confirmação visual de `Ready` permanece pendente porque a sessão de validação não está autenticada na conta Vercel correta.

## Próxima ação

Após publicar, conceder à app key VTEX a permissão `PCI Gateway / View Payment Data` e disparar ou aguardar o ciclo de sync. Se a permissão não existir, o dado permanece declaradamente indisponível. Taxas exigem uma integração financeira distinta; não é seguro deduzi-las do pedido bruto.
