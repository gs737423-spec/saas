# Hardening VTEX — dados reais

## Resultado

- Implementado checkpoint v3 recent-first e cursor para janelas densas.
- Implementada revalidação de catálogo v6 com persistência não destrutiva de preço/estoque.
- Corrigida chave canônica derivada de nome confiável e adicionada descoberta de sales channels observados.
- Reclassificação local em lote após mapping, sem full sync e sem escrita VTEX.
- Removida injeção de marketplaces demo em dados reais; painel de mappings atualiza durante sync.

## Validação

- `npm run typecheck`: PASS.
- Vitest com pool `vmThreads`: 230/230 PASS.
- `npm run build`: PASS fora do sandbox (Vite/Tailwind nativo requer criação de processo no Windows).

## Próxima ação

Revisão adversarial do diff e, depois de aprovação do usuário, commit/push e observação read-only da primeira run em produção.
