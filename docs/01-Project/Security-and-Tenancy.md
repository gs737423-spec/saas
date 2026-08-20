---
type: security
project: SaaS E-commerce
status: implemented-untested
updated: 2026-08-13
---

# Segurança e multiempresa

## Regra central
Nenhum usuário, serviço, job, relatório ou integração pode acessar dados de outra empresa.

## Estado real (auditado em 2026-08-13)
Isolamento multiempresa está **implementado no código**, não é mais aspiracional. Ver `docs/01-Project/Current-State.md` seção "Multiempresa" pro detalhe técnico (`requireCompany.ts`, RLS por tabela, 25/25 endpoints auditados). Nenhum vazamento cross-tenant encontrado na auditoria estática. MFA TOTP é opt-in para `platform_admins`: quando há fator verificado, `requireAdmin` exige a claim JWT `aal2` em toda API administrativa; o login não redireciona antes do desafio. **Falta**: teste real com 2+ empresas simultâneas e teste ponta a ponta de login admin com TOTP.

## Verificações obrigatórias
- autenticação;
- autorização;
- vínculo usuário-tenant;
- filtro por tenant nas consultas;
- políticas de banco;
- armazenamento de credenciais no servidor;
- logs sem segredos;
- proteção contra enumeração de IDs;
- testes de isolamento.

## Operações proibidas por padrão
- excluir pedidos;
- editar pedidos de marketplaces;
- cancelar pedidos;
- alterar dados reais de clientes;
- alterar empresa/tenant de um registro;
- executar reset do banco;
- rodar migração em produção sem plano e autorização;
- escrever em produção durante testes.

## Modelo de acesso
| Ação | Leitura | Escrita | Exclusão |
|---|---:|---:|---:|
| Pedidos externos | permitida no tenant | bloqueada por padrão | bloqueada |
| Produtos internos | conforme perfil | conforme autorização | confirmação |
| Configuração da empresa | conforme perfil | confirmação | bloqueada |
| Credenciais | servidor apenas | fluxo seguro | rotação controlada |

## Testes essenciais
- usuário A não lê dados do tenant B;
- tentativa de trocar ID na URL não atravessa tenant;
- jobs carregam tenant explícito;
- cache inclui chave de tenant;
- relatórios e exportações respeitam tenant;
- logs não expõem tokens ou dados sensíveis.
