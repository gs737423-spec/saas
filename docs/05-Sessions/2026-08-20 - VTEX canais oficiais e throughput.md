# Sessão — VTEX canais oficiais e throughput

## Resultado

- Confirmado que catálogo e cron progrediam, mas a state machine adiava a
  descoberta de canais até `orders`.
- Adicionada resolução determinística `affiliate -> salesChannel -> nome
  oficial VTEX`, tenant-scoped e sem heurística por sigla.
- Descoberta movida para antes do catálogo, com orçamento de 25 segundos.
- Mapping manual protegido por compare-and-set.
- Concorrência limitada do catálogo ajustada de 10 para 32 workers.

## Validação

- Typecheck: PASS.
- Testes: 256/256 PASS.
- Build: PASS.
- VTEX permanece read-only.

## Próxima ação

Revisar diff, publicar somente após autorização e observar em produção o
throughput, 429/retries, quantidade de canais resolvidos e freshness dos
pedidos.
