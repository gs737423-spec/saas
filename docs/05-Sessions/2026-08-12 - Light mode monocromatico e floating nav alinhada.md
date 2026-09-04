---
type: session
project: SaaS E-commerce
date: 2026-08-12
status: ready-for-visual-review
---

# Light mode monocromático e Floating Navigation alinhada

## Estado encontrado

O light mode já não usava branco puro como token padrão, mas ainda tinha
diferenças tonais insuficientes. A ilha era content-sized e clara no tema light,
perdendo relação de escala e contraste com o dashboard.

## Mudanças

- Substituída a hierarquia por `#DDE5EB` → `#E7EDF2` → `#F3F6F8` → `#F7F9FA`.
- A ilha passou a usar `min(1600px, viewport - 2 × gutter)` e grid em três
  zonas; as rotas permanecem centralizadas e icon-only.
- A ilha light voltou a dark blue-gray glass; dark foi preservado.
- Active indicator, tooltips, foco e reduced motion foram preservados.

## Validações

- `git diff --check`: limpo.
- `npm run build`: passou.
- Sem sessão autenticada local para revisão visual das oito rotas.

## Próxima ação

Validar visualmente na Vercel em light e dark, especialmente a leitura imediata
da sequência app → section → card e o alinhamento da ilha ao conteúdo.

