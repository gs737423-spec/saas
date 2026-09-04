# Consolidação UX product-wide no light mode

## Decisão

Consolidar o light mode com hierarquia de superfícies e densidade operacional compartilhadas, sem alterar login, dark mode, segurança, dados ou contratos de API.

Relatórios passa a ser um documento analítico contínuo, sem slides. Marketplaces passa a apresentar cada canal em uma faixa independente de microbarras, usando o período comparado apenas como delta. Estados sem telemetria ou dado cadastrado devem ser declarados como indisponíveis; métricas, alertas, status e identificadores não podem ser fabricados.

## Motivo

O produto acumulava cards aninhados, áreas excessivamente altas, comparações visuais sobrepostas e mensagens técnicas. A consolidação reduz ruído sem ampliar escopo funcional nem esconder ausência de dados.

## Limites preservados

- `/login` não foi alterado.
- Dark mode não recebeu redesign.
- RBAC, tenancy, autenticação, APIs, migrations e integrações não foram alterados.
- Nenhuma biblioteca pesada de exportação foi adicionada.
- Nenhum commit, stage, push ou deploy faz parte desta decisão.

## Validação

TypeScript, testes unitários, testes de segurança, scan de service role e build de produção passaram em 2026-08-13. A inspeção visual autenticada precisa de uma sessão de teste válida e permanece pendente.
