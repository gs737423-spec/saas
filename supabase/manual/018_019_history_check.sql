-- READ ONLY. This checks Supabase CLI migration history only.
-- It does not apply, repair, insert, update, or delete anything.

select
  column_name,
  data_type,
  ordinal_position
from information_schema.columns
where table_schema = 'supabase_migrations'
  and table_name = 'schema_migrations'
order by ordinal_position;

select version
from supabase_migrations.schema_migrations
where version in ('018', '019')
order by version;
