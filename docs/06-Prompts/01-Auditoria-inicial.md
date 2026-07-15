---
type: prompt
project: SaaS E-commerce
status: approved
---

# Auditoria inicial do repositório

Analise o repositório atual em modo estritamente somente leitura.

Antes de começar, leia `CLAUDE.md` e toda a pasta `docs/01-Project/`.

Objetivos:
1. mapear a estrutura real do projeto;
2. identificar rotas, páginas, componentes, serviços, tipos, APIs e fontes de dados;
3. localizar como os dados chegam às telas;
4. verificar se há caminhos duplicados, lógica repetida ou responsabilidades misturadas;
5. identificar código aparentemente desnecessário, mas sem remover nada;
6. verificar riscos de segurança e isolamento multiempresa;
7. verificar se pedidos e informações de empresas estão protegidos contra edição e exclusão;
8. comparar o código com os requisitos documentados;
9. preencher apenas com fatos confirmados:
   - `docs/01-Project/Current-State.md`;
   - `docs/01-Project/Architecture.md`;
   - `docs/01-Project/Data-Flows.md`;
10. criar um relatório em `docs/04-Audits/` com data e título.

Limites obrigatórios:
- não altere código de aplicação;
- não delete, mova ou renomeie arquivos;
- não instale dependências;
- não execute migrações;
- não acesse `.env` ou credenciais;
- não execute deploy;
- não escreva no banco;
- não modifique pedidos, clientes, empresas ou dados reais;
- não considere um arquivo obsoleto apenas porque não encontrou uso imediato;
- diferencie fato, hipótese e recomendação.

Ao final, apresente:
- resumo executivo;
- mapa da arquitetura;
- mapa dos fluxos de dados;
- achados por severidade;
- lista de possíveis duplicações;
- lista de código possivelmente obsoleto com evidências;
- lacunas de segurança;
- documentação criada ou atualizada;
- próximos passos propostos, sem implementá-los.
