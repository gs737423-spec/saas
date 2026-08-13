# Login enterprise access composition

**Data:** 2026-08-13

**Status:** aprovado e implementado

**Substitui:** direção visual “Vintec Expanding Access” de 2026-07-28

## Contexto

O login anterior carregava efeitos atmosféricos, expansão e elementos visuais com protagonismo maior que a tarefa de acesso. A nova direção pede uma entrada institucional, silenciosa e imediatamente funcional, sem transformar `/login` em landing page.

## Decisão

- manter um único card central com o formulário visível desde o carregamento;
- usar fundo navy institucional, uma iluminação radial muito discreta e no máximo duas regiões de linhas estáticas;
- manter `Voltar ao site` e `Ajuda` diretamente sobre o background;
- usar o logo real do produto, controles altos e CTA azul da mesma família cromática;
- preservar integralmente o bridge e toda a lógica de autenticação em `Login.tsx`;
- manter cadastro fechado e os links legais existentes;
- usar WhatsApp configurado para ajuda, com e-mail institucional como fallback legítimo.

## Consequências

A composição fica mais previsível, legível e responsiva, com menor ruído e sem dependência de animações. Os componentes históricos permanecem no repositório por segurança, mas a rota passa a usar classes isoladas `access-*` em `src/site/login-enterprise.css`.

## Rollback

Reverter os arquivos visuais e remover a importação de `login-enterprise.css`; nenhuma reversão de banco, autenticação ou API é necessária.
