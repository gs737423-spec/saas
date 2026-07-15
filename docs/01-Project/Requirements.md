---
type: requirements
project: SaaS E-commerce
status: draft
updated: 2026-07-15
---

# Requisitos

## Requisitos funcionais
- Consolidar dados de múltiplos canais.
- Exibir faturamento bruto e líquido.
- Exibir pedidos, ticket médio, CMV e margem.
- Comparar marketplaces.
- Permitir navegação para Produto 360.
- Identificar estoque crítico e produtos em queda.
- Exibir dados somente da empresa autenticada.

## Requisitos de dados
- Toda entidade de negócio deve possuir vínculo inequívoco com um tenant.
- Dados externos devem ser validados antes de persistir.
- Identificadores externos devem ser preservados para rastreabilidade.
- Normalização não deve apagar o payload bruto necessário para auditoria.
- Escritas devem ser idempotentes sempre que possível.

## Requisitos não funcionais
- segurança;
- rastreabilidade;
- desempenho;
- responsividade;
- observabilidade;
- manutenção;
- recuperação de falhas;
- mínimo privilégio.

## Restrições
- Não editar ou excluir pedidos externos.
- Não alterar dados reais de clientes ou empresas.
- Não expor segredos no navegador.
- Não misturar dados entre tenants.
