-- Logo da empresa (avatar) — substitui as iniciais quando o cliente ou o
-- admin sobe uma imagem. Uma coisa só, compartilhada: quem editar (admin
-- ou o próprio cliente) atualiza pros dois lados, é o mesmo registro.
alter table companies add column if not exists logo_url text;

-- Bucket público (leitura) pra servir a logo direto por URL — upload em si
-- só acontece via service_role (api/company-logo.ts), nunca client-side
-- direto no Storage, então não precisa de policy de INSERT pra
-- anon/authenticated.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;
