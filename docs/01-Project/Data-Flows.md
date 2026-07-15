---
type: data-flow
project: SaaS E-commerce
status: needs-audit
updated: 2026-07-15
---

# Fluxos de dados

## Fluxo padrão

```mermaid
sequenceDiagram
    participant EXT as Marketplace
    participant CON as Conector
    participant ING as Ingestão
    participant VAL as Validação
    participant NOR as Normalização
    participant DB as Banco
    participant DOM as Domínio
    participant UI as Interface

    EXT->>CON: resposta da API
    CON->>ING: payload + tenant + metadados
    ING->>VAL: dados brutos
    VAL->>NOR: dados válidos
    NOR->>DB: upsert idempotente por tenant
    DB->>DOM: entidades internas
    DOM->>UI: métricas e visualizações
```

## Mapa a preencher após auditoria
| Dado | Origem | Entrada | Validação | Normalização | Persistência | Leitura | Tela |
|---|---|---|---|---|---|---|---|
| Pedidos |  |  |  |  |  |  |  |
| Produtos |  |  |  |  |  |  |  |
| Estoque |  |  |  |  |  |  |  |
| Custos |  |  |  |  |  |  |  |
| Canais |  |  |  |  |  |  |  |

## Regras de integridade
- Não confiar em campos externos sem validação.
- Não sobrescrever dados internos com valores ausentes.
- Não duplicar pedidos ao reprocessar.
- Não cruzar tenants.
- Não transformar falha parcial em sucesso silencioso.
