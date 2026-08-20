# Comparativo temporal e categoria analítica

## Decisão

Marketplaces passa a representar receita atual e anterior com barras sobrepostas, usando a mesma escala dentro de cada faixa de marketplace. A série anterior usa tom neutro e largura total; a atual usa a cor do canal e largura visual menor. O resumo lateral, a legenda e o tooltip mostram atual, anterior e variação.

Categoria passa a ser uma dimensão analítica compartilhada por Produtos e Estoque. `category_id` é a identidade preferencial quando disponível, `category_name` é o rótulo de apresentação e uma chave derivada do nome é usada apenas como fallback. Ausência de categoria é um estado explícito e filtrável, não um dado descartado.

## Motivo

O delta isolado não permite avaliar volume, direção e base de comparação. O overlay preserva densidade e torna os dois períodos diretamente comparáveis. A categoria já existe no modelo persistido e pode gerar inteligência sem criar estrutura paralela ou categorias fixas na interface.

## Limites

- a escala é independente entre marketplaces e compartilhada apenas entre atual e anterior na mesma faixa;
- o mapeamento temporal existente foi preservado: 1, 7 ou 30 dias de deslocamento;
- períodos longos são agregados em buckets consecutivos, sem amostragem que reduza totais;
- não houve migration, nova biblioteca de gráfico, integração VTEX ou dado fabricado;
- login, autenticação, RBAC, tenancy, conexões e dark mode não foram alterados;
- nenhuma ação Git ou deploy faz parte desta implementação.

## Validação

Em 2026-08-14 passaram: typecheck, 75 testes gerais, 49 testes de segurança, scan da fronteira de service role e build de produção. A validação visual autenticada em múltiplos viewports permanece pendente por falta de uma sessão local controlada.
