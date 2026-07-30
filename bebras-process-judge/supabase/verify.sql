-- Supabase SQL Editor에서 실행하여 v0.6 설치 상태를 확인합니다.
select public.get_backend_status() as backend_status;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('published_sets', 'server_attempts')
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('published_sets', 'server_attempts')
order by tablename, policyname;
