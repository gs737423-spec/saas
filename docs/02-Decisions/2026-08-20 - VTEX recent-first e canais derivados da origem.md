# VTEX recent-first e canais derivados da origem

## Contexto

Uma primeira carga grande podia levar horas para disponibilizar dados atuais porque varria o histórico do mais antigo para o mais recente. A dimensão visual também injetava marketplaces padrão e a descoberta automática de affiliates aceitava nomes confiáveis da VTEX, mas produzia chaves com espaços incompatíveis com o banco.

## Decisão

- O backfill de pedidos inicia no presente e retrocede até um piso persistido no checkpoint.
- Migração de checkpoint preserva dados e o limite ainda pendente; não reinicia nem apaga pedidos.
- Canal canônico automático exige nome retornado por registry oficial da VTEX; sigla sozinha nunca é inferência suficiente.
- Canais não usados não são persistidos nem injetados em analytics real. Fixtures permanecem exclusivas do modo demo.
- Reclassificação após mapping altera apenas a classificação local tenant-scoped, sem reimportar ou modificar a VTEX.
- Falha de enriquecimento de preço/estoque nunca apaga valor válido anterior.

## Consequências

Dashboards recebem dados recentes antes de o backfill terminar. Limites inclusivos podem repetir pedidos na borda temporal, mas a persistência idempotente evita duplicidade e elimina buracos. Canais customizados confiáveis usam chave slug estável e display name original.
