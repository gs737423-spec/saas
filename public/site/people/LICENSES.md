# Origem das imagens humanizadas — site institucional Vintec

Diferente do processo original planejado (curadoria em banco de imagens
gratuito), estas 3 imagens foram **fornecidas diretamente pelo usuário**
(Gabriel) em 2026-07-16, para uso oficial nesta fase do site. Não foram
baixadas de banco de imagens — portanto não há página de origem/autor de
terceiro a documentar. Ficam registradas aqui a procedência e o
processamento aplicado, para rastreabilidade.

| Arquivo processado | Original | Uso no site | Processamento |
|---|---|---|---|
| `processed/vintec-hero-tablet.webp` | `originals/vintec-hero-tablet-original.png` | Hero (todos os slides) | Fundo removido (flood-fill + feather), recorte automático (`trim`), WebP q92 |
| `processed/vintec-banner-laptop.webp` | `originals/vintec-banner-laptop-original.png` | Banner comercial "Organização" | Fundo removido (threshold maior — fundo original tinha gradiente/vinheta), recorte automático, WebP q92 |
| `processed/vintec-banner-smartphone.webp` | `originals/vintec-banner-smartphone-original.png` | Banner comercial "Crescimento" | Fundo removido (flood-fill + feather), recorte automático, WebP q92 |

Script de processamento: gerado ad-hoc em sessão de trabalho (Node +
`sharp`, flood-fill de bordas por distância de cor), não versionado no
repositório — o resultado final (`processed/*.webp`) é o artefato que
importa.

**Não são fotos de banco de imagens de terceiros** — não se aplica
atribuição de autor/licença externa. Se novas imagens de pessoas forem
adicionadas depois vindas de banco de imagens, documentar aqui: banco,
autor, URL, data de acesso e licença.

Regra do site: essas imagens ilustram a proposta comercial da Vintec — não
representam funcionários, consultores ou especialistas reais da empresa.
Nenhuma legenda no site deve sugerir o contrário.
