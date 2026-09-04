# Integração nativa VTEX

Status: schema 018/019 aplicado manualmente segundo o usuário; runtime implementado localmente e ainda não habilitado em produção.

## Autenticação

O backend usa `appKey` + `appToken`, o mecanismo oficial de application keys para integrações server-to-server. O nome da conta é aceito apenas como slug e o host é construído internamente como `https://{account}.vtexcommercestable.com.br`; URLs fornecidas pelo usuário são rejeitadas. As credenciais são criptografadas com o AES-256-GCM já adotado pelo projeto e nunca retornam nas APIs de status ou logs.

Permissões obrigatórias: Catalog, Orders e Logistics/Inventory. Pricing é opcional e resulta em preço `N/D` quando ausente. Feed é verificado, mas não ativado nesta fase.

## Fluxos

- Conexão: valida formato, testa permissões e somente então persiste o segredo criptografado.
- Full sync: categorias, catálogo/SKUs, preço, estoque por warehouse, pedidos D-365, normalização, deduplicação e validação final.
- Incremental temporário: Orders API por `lastChange`, com sobreposição de 15 minutos.
- Continuação: runs, stages, janelas e offsets ficam em `integration_sync_runs`; o cron VTEX retoma a cada 15 minutos.
- Agenda: o cron acorda a cada 15 minutos, mas AUTO SYNC só processa a conexão quando `next_sync_at` vence; uma conclusão agenda a próxima execução para 24 horas depois. MANUAL SYNC ignora a agenda, nunca o lock ou o breaker.
- Desconexão: desativa credenciais sem apagar histórico.

O catálogo usa lotes de 40 SKUs. Pedidos usam janelas iniciais de sete dias e são reduzidos adaptativamente até uma hora quando o limite oficial de 30 páginas é atingido. Uma janela horária que ainda exceda o limite termina como `partial`, nunca como sucesso falso.

## Feed v3

Não está ativo. Eventos do Feed não contêm o pedido completo, podem repetir, só devem ser confirmados após persistência e têm retenção limitada. O scheduler anterior era diário e incompatível com essa garantia. A arquitetura contém cliente de retrieve/commit, mas a ativação exige permissão Feed validada, teste real e estratégia operacional de frequência/observabilidade aprovada.

## Segurança e tenancy

Todas as rotas exigem sessão, capability e `company_id` derivado do contexto autenticado. As novas tabelas têm RLS e consultas server-side carregam escopo explícito de empresa e conexão. O conector é somente leitura na VTEX: não altera catálogo, preço, estoque nem pedido externo.

## Limites atuais

- Migrations 001–023 fisicamente auditadas e histórico da Supabase CLI reconciliado em 2026-08-20; `supabase migration list --linked` confirmou correspondência integral local/remota.
- Smoke test real pendente por ausência de credenciais VTEX autorizadas.
- Mapeamentos de `affiliateId` são tenant-scoped. Affiliate novo é registrado como canal externo unresolved, não bloqueia o sync e não exige migration.
- O classifier e a API aceitam qualquer canonical channel válido. Magalu permanece canal explícito conhecido; nenhuma integração, credencial ou endpoint Magalu direto foi criado nesta fase.
- Pedidos unresolved elegíveis continuam nos totais globais e aparecem no breakdown pelo nome externo/fallback; a resolução pode ser alterada num sync posterior sem duplicar o pedido.
- Margem, custo real, repasse, frete líquido e refunds detalhados permanecem `N/D` quando a fonte oficial usada não os oferece.
- Escala de muitas conexões ainda exige fila gerenciada; o cron atual processa sequencialmente dentro de 300 segundos.
- O circuit breaker durável bloqueia AUTO e MANUAL SYNC por 60 minutos após cinco falhas consecutivas de run. O breaker em memória continua como otimização local de 60 segundos.
- A UI lista dinamicamente `vtex_channel_mappings` e `sales_channels`, permite resolver um canal descoberto para um canal existente ou criar um canal analítico válido e exige full sync explícita para reclassificar histórico sem duplicação.
- A matriz detalhada de permissões retornada pelo backend ainda não é exibida na UI; permissões obrigatórias continuam validadas antes de conectar.
- Rotação dual-key/versionada de `INTEGRATIONS_ENCRYPTION_KEY` não existe nesta fase; a master key deve permanecer estável depois da primeira conexão.
- Teste real de RLS com duas sessões/tenants e smoke test VTEX autorizado continuam pendentes; testes estáticos não são promovidos a PASS de banco real.
