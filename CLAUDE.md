# SaaS de Gestão de E-commerce — Instruções do Projeto

## Objetivo
Este repositório contém uma plataforma SaaS multiempresa para consolidar e analisar dados de e-commerce vindos de marketplaces e lojas próprias.

## Fonte de contexto
Antes de propor ou executar alterações relevantes, leia:
- `docs/00-Home.md`
- `docs/01-Project/Overview.md`
- `docs/01-Project/Current-State.md`
- `docs/01-Project/Requirements.md`
- `docs/01-Project/Architecture.md`
- `docs/01-Project/Data-Flows.md`
- `docs/01-Project/Security-and-Tenancy.md`
- decisões relacionadas em `docs/02-Decisions/`

## Regras obrigatórias
1. Comece tarefas de código em modo de análise e plano.
2. Não apague, renomeie ou substitua arquivos existentes sem justificar e obter autorização explícita.
3. Prefira alterações pequenas, localizadas e reversíveis.
4. Antes de alterar código, audite o estado atual e liste arquivos afetados, riscos e testes necessários.
5. Nunca trate código aparentemente desnecessário como seguro para remoção sem verificar imports, chamadas, rotas, dependências e comportamento em produção.
6. Não faça refatorações amplas junto com uma funcionalidade sem necessidade comprovada.
7. Preserve funcionalidades existentes, contratos de API, rotas, tipos, dados e compatibilidade.
8. Não altere arquivos `.env`, credenciais, tokens ou segredos.
9. Não execute deploy, push, migração, reset de banco ou comando destrutivo sem autorização explícita.
10. Não edite, exclua, cancele ou altere pedidos, clientes, empresas, integrações ou informações reais.
11. Dados reais de tenants, empresas, clientes, pedidos e transações são somente leitura por padrão.
12. Toda consulta e processamento devem respeitar `tenant_id` ou o identificador de isolamento equivalente.
13. Nunca misture dados entre empresas, mesmo em cache, logs, exportações, testes ou relatórios.
14. Para testes, use mocks, fixtures ou dados anonimizados. Nunca use dados reais para testar escrita.
15. Alterações de banco devem ser aditivas e reversíveis sempre que possível.
16. Antes de criar uma estrutura nova, verifique se já existe uma estrutura equivalente.
17. Não duplique serviços, helpers, tipos, componentes ou regras de negócio.
18. Mantenha responsabilidades separadas entre UI, domínio, integração, persistência e automação.
19. Registre decisões importantes em `docs/02-Decisions/`.
20. Registre o encerramento de cada sessão relevante em `docs/05-Sessions/`.

## Regra para integrações e dados
Toda informação recebida de marketplaces deve passar por camadas explícitas:
1. origem externa;
2. autenticação e identificação da empresa;
3. ingestão;
4. validação;
5. normalização;
6. persistência isolada por tenant;
7. processamento de métricas;
8. leitura pela aplicação;
9. auditoria e logs.

Não permita que dados externos sejam enviados diretamente para componentes visuais ou tabelas finais sem validação e normalização.

## Auditoria antes de remover código
Ao identificar algo aparentemente obsoleto:
- informe o caminho;
- explique a função atual;
- encontre referências;
- classifique como usado, possivelmente usado ou não usado;
- descreva o impacto da remoção;
- proponha uma remoção separada;
- não remova durante a auditoria.

## Formato de resposta para mudanças
Apresente:
1. estado encontrado;
2. problema;
3. causa provável;
4. plano;
5. arquivos afetados;
6. riscos;
7. implementação;
8. validações executadas;
9. documentação atualizada.

## Comandos de validação
Descubra os comandos reais no `package.json` antes de executá-los.
Quando disponíveis, valide com:
- lint;
- typecheck;
- testes;
- build;
- inspeção do diff.

Não declare que passou sem executar.

## Documentação
Atualize `docs/01-Project/Current-State.md` quando o estado funcional mudar.
Crie uma decisão quando houver escolha arquitetônica, mudança de contrato ou regra permanente.
Não reescreva o histórico para parecer que uma decisão sempre existiu.
