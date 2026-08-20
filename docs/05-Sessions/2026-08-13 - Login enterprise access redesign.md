# Sessão — Login enterprise access redesign

**Data:** 2026-08-13

## Resultado

Redesenho visual de `/login` concluído com card central sólido, formulário imediatamente disponível, utilities superiores, fundo navy e duas malhas lineares estáticas. A tela foi separada visualmente por um stylesheet exclusivo da rota.

## Preservação funcional

Nenhum handler de login, recuperação, MFA, cooldown, redirecionamento ou integração Supabase foi alterado. O botão de mostrar senha voltou à ordem normal de teclado. O atalho de ajuda usa WhatsApp configurado ou o e-mail institucional.

## Arquivos principais

- `src/pages/Login.tsx`
- `src/site/login-enterprise.css`
- `src/site/components/login-expanding/ExpandingLoginCard.tsx`
- `src/site/components/login-expanding/ExpandedLoginContent.tsx`
- `src/site/components/login-expanding/LoginAtmosphereBackground.tsx`
- `src/site/components/login/LoginField.tsx`

## Validação

- renderização inspecionada no navegador em 1280×720, sem overflow ou corte;
- árvore acessível confirmou links, campos e botões esperados;
- preenchimento e mostrar/ocultar senha validados no navegador;
- `autocomplete=email` e `autocomplete=current-password` confirmados;
- validações automatizadas registradas no encerramento da tarefa.

## Próxima ação

Validar login real e MFA com credenciais controladas quando houver autorização e conta de teste apropriada.

## Lapidação final e freeze visual

A baseline visual recebeu a última lapidação em 2026-08-13: card com presença moderadamente maior, tipografia neutra nos campos, links auxiliares legíveis, divisor mais discreto, linhas de fundo mais longas e radial reduzido. A composição, os fluxos e a arquitetura permaneceram inalterados.

Resultado dos gates: typecheck, 58 testes gerais, 49 testes de segurança, service-role scan e build aprovados. A primeira execução dos testes gerais expôs uma intermitência preexistente no teste de adulteração OAuth da Shopee; a repetição sem mudanças passou integralmente.

**Login visual baseline approved. Future tasks must not modify `/login` unless explicitly scoped to login.**
