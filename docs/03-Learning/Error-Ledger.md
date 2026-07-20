---
type: error-ledger
project: Vintec — site institucional
status: active
updated: 2026-07-17
---

# Error Ledger — Site institucional Vintec

> Registro de erros reais cometidos nas implementações da home, para não repetir.
> Cada erro: sintoma → causa → correção esperada.

## Home — reconstrução dos 4 primeiros blocos (sessão 2026-07-17)

| ID | Erro | Sintoma | Correção esperada |
|----|------|---------|-------------------|
| VIN-E01 | Carrossel sem autoplay funcional | Slide não trocava sozinho de forma confiável / risco de múltiplos intervalos | Autoplay 5s, transição 500–800ms, loop infinito, reinicia contagem após troca manual, pausa no hover, respeita `prefers-reduced-motion`, limpeza do timer |
| VIN-E02 | Controles do carrossel à esquerda | Setas/dots no canto inferior esquerdo, dentro da coluna de texto | Controles centralizados horizontalmente, próximos à base do hero (18–28px), fora da coluna de texto |
| VIN-E03 | Excesso de cards/chips flutuantes | 4 logos em 4 caixas + chips espalhados poluindo o hero | Máximo 2 chips pequenos e translúcidos por slide; marcas vão para seção própria |
| VIN-E04 | Pessoas sem ancoragem (flutuando) | Recorte "no ar", com espaço/sombra sob os pés | `position:absolute; bottom:0`, corpo cortado no limite inferior, sem margem/sombra circular; ocupa 76–90% da altura útil |
| VIN-E05 | Exclusão indevida de "Quem Somos" | Seção institucional substituiu a "Quem Somos" | "Quem Somos" + números logo após o hero, separada da seção institucional |
| VIN-E06 | Seção institucional sem composição | Pessoa pequena dentro de um círculo claro vazio | Texto à esquerda + pessoa grande ancorada à direita + forma gráfica própria, espaço preenchido |
| VIN-E07 | Card de serviço virou bloco de dashboard | Bloco horizontal com print da plataforma no lugar de um card vertical | Um único card vertical (referência Petina); print vai para seção de demonstração própria |
| VIN-E08 | Linguagem excessivamente técnica | Headlines com "API/visão executiva/dados normalizados" | Linguagem simples para cliente de marketplace; termos técnicos só em textos secundários |
| VIN-E09 | Execução sem comparação visual com a referência | Entregas sem validar screenshots contra a Petina em cada breakpoint | Validar 1366×768, 1440×900, 1024×768, 390×844 com screenshots antes de entregar |

## Anti-patterns relacionados (ver [[Anti-Patterns]])
- ERR-001 (GVO): solução visual artificial.
- ERR-004 (GVO): alterar antes de auditar.
- ERR-005 (GVO): confundir quantidade de funcionalidades/elementos com valor.
