-- v0.6 스키마입니다.
-- schema.sql과 같은 내용이며 여러 번 실행해도 안전합니다(idempotent).
-- Supabase CLI(npm run supabase:push)를 쓰는 경우를 위한 파일입니다.
-- SQL Editor를 쓰는 경우에는 supabase/schema.sql 하나만 실행하면 됩니다.

-- 비버 사고과정 온라인 저지 v0.6
-- Supabase Auth + RLS + 공개 과제 RPC + 중복 제출 방지
--
-- 이 파일은 여러 번 실행해도 안전합니다(idempotent).
-- 이미 저장된 과제와 학생 제출 기록은 지워지지 않습니다.
-- Supabase Dashboard > SQL Editor에 전체를 붙여 넣고 Run을 누르세요.

create extension if not exists pgcrypto;

create table if not exists public.published_sets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  access_code text not null unique,
  title text not null,
  problem_snapshots jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.server_attempts (
  id uuid primary key default gen_random_uuid(),
  published_set_id uuid not null references public.published_sets(id) on delete cascade,
  client_submission_id uuid,
  access_code text not null,
  nickname text not null,
  class_code text not null,
  completed_at timestamptz not null default now(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.server_attempts
  add column if not exists client_submission_id uuid;

update public.server_attempts
set client_submission_id = case
  when coalesce(payload->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then (payload->>'id')::uuid
  else gen_random_uuid()
end
where client_submission_id is null;

alter table public.server_attempts
  alter column client_submission_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'published_sets_access_code_format'
      and conrelid = 'public.published_sets'::regclass
  ) then
    alter table public.published_sets
      add constraint published_sets_access_code_format
      check (access_code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' and char_length(access_code) between 4 and 24);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'published_sets_title_length'
      and conrelid = 'public.published_sets'::regclass
  ) then
    alter table public.published_sets
      add constraint published_sets_title_length
      check (char_length(title) between 1 and 80);
  end if;

  alter table public.published_sets
    drop constraint if exists published_sets_problem_array;
  alter table public.published_sets
    add constraint published_sets_problem_array
    check (
      case
        when jsonb_typeof(problem_snapshots) = 'array'
          then jsonb_array_length(problem_snapshots) between 1 and 50
        else false
      end
    );

  if not exists (
    select 1 from pg_constraint
    where conname = 'server_attempt_payload_object'
      and conrelid = 'public.server_attempts'::regclass
  ) then
    alter table public.server_attempts
      add constraint server_attempt_payload_object
      check (jsonb_typeof(payload) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'server_attempt_name_lengths'
      and conrelid = 'public.server_attempts'::regclass
  ) then
    alter table public.server_attempts
      add constraint server_attempt_name_lengths
      check (char_length(nickname) between 1 and 40 and char_length(class_code) between 1 and 40);
  end if;
end $$;

create unique index if not exists server_attempts_submission_unique
  on public.server_attempts(published_set_id, client_submission_id);
create index if not exists server_attempts_set_idx
  on public.server_attempts(published_set_id);
create index if not exists server_attempts_completed_idx
  on public.server_attempts(completed_at desc);
create index if not exists published_sets_teacher_idx
  on public.published_sets(teacher_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists published_sets_touch_updated_at on public.published_sets;
create trigger published_sets_touch_updated_at
before update on public.published_sets
for each row execute function public.touch_updated_at();

alter table public.published_sets enable row level security;
alter table public.server_attempts enable row level security;

-- 교사는 자신의 과제만 직접 조회·수정·삭제합니다.
drop policy if exists "teachers manage own published sets" on public.published_sets;
drop policy if exists "teachers select own published sets" on public.published_sets;
create policy "teachers select own published sets"
on public.published_sets
for select
to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists "teachers insert own published sets" on public.published_sets;
create policy "teachers insert own published sets"
on public.published_sets
for insert
to authenticated
with check ((select auth.uid()) = teacher_id);

drop policy if exists "teachers update own published sets" on public.published_sets;
create policy "teachers update own published sets"
on public.published_sets
for update
to authenticated
using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);

drop policy if exists "teachers delete own published sets" on public.published_sets;
create policy "teachers delete own published sets"
on public.published_sets
for delete
to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists "teachers read attempts for own sets" on public.server_attempts;
create policy "teachers read attempts for own sets"
on public.server_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.published_sets ps
    where ps.id = server_attempts.published_set_id
      and ps.teacher_id = (select auth.uid())
  )
);

-- 학생은 테이블에 직접 접근하지 않고 제한된 RPC만 사용합니다.
revoke all on table public.published_sets from anon;
revoke all on table public.server_attempts from anon;
grant select, insert, update, delete on table public.published_sets to authenticated;
grant select on table public.server_attempts to authenticated;

create or replace function public.get_backend_status()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'schema_version', '0.6.0',
    'server_time', now()
  );
$$;

create or replace function public.get_published_set(p_access_code text)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', ps.id,
    'access_code', ps.access_code,
    'title', ps.title,
    'problems', ps.problem_snapshots,
    'is_active', ps.is_active,
    'updated_at', ps.updated_at
  )
  from public.published_sets ps
  where ps.access_code = upper(trim(p_access_code))
    and ps.is_active = true
  limit 1;
$$;

create or replace function public.upsert_published_set(
  p_access_code text,
  p_title text,
  p_problem_snapshots jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_code text := upper(trim(p_access_code));
  v_title text := left(trim(p_title), 80);
  v_existing public.published_sets%rowtype;
  v_saved public.published_sets%rowtype;
begin
  if v_teacher_id is null then
    raise exception '교사 로그인이 필요합니다.' using errcode = '42501';
  end if;

  if v_code !~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' or char_length(v_code) not between 4 and 24 then
    raise exception '과제 코드는 영문 대문자, 숫자, 하이픈으로 4~24자여야 합니다.' using errcode = '22023';
  end if;

  if v_title = '' then
    v_title := '비버 사고과정 과제';
  end if;

  if jsonb_typeof(p_problem_snapshots) <> 'array'
     or jsonb_array_length(p_problem_snapshots) not between 1 and 50 then
    raise exception '게시할 문제는 1~50개여야 합니다.' using errcode = '22023';
  end if;

  if octet_length(p_problem_snapshots::text) > 5000000 then
    raise exception '문제 데이터가 너무 큽니다. 큰 이미지는 파일 URL로 분리해 주세요.' using errcode = '54000';
  end if;

  select * into v_existing
  from public.published_sets
  where access_code = v_code
  for update;

  if found and v_existing.teacher_id <> v_teacher_id then
    raise exception '이미 다른 교사가 사용 중인 과제 코드입니다.' using errcode = '23505';
  end if;

  if found then
    update public.published_sets
    set title = v_title,
        problem_snapshots = p_problem_snapshots,
        is_active = true
    where id = v_existing.id
    returning * into v_saved;
  else
    insert into public.published_sets (
      teacher_id, access_code, title, problem_snapshots, is_active
    ) values (
      v_teacher_id, v_code, v_title, p_problem_snapshots, true
    )
    returning * into v_saved;
  end if;

  return jsonb_build_object(
    'id', v_saved.id,
    'access_code', v_saved.access_code,
    'title', v_saved.title,
    'problem_snapshots', v_saved.problem_snapshots,
    'is_active', v_saved.is_active,
    'updated_at', v_saved.updated_at
  );
end;
$$;

create or replace function public.submit_published_attempt(
  p_access_code text,
  p_attempt jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_set public.published_sets%rowtype;
  v_id uuid;
  v_submission_id uuid;
  v_nickname text;
  v_class_code text;
  v_completed_at timestamptz := now();
  v_raw_completed_at text;
begin
  select * into v_set
  from public.published_sets
  where access_code = upper(trim(p_access_code))
    and is_active = true
  limit 1;

  if not found then
    raise exception '공개된 과제 코드를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_attempt) <> 'object' then
    raise exception '제출 데이터 형식이 올바르지 않습니다.' using errcode = '22023';
  end if;

  if octet_length(p_attempt::text) > 2000000 then
    raise exception '제출 데이터가 너무 큽니다.' using errcode = '54000';
  end if;

  if coalesce(p_attempt->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_submission_id := (p_attempt->>'id')::uuid;
  else
    v_submission_id := gen_random_uuid();
  end if;

  v_nickname := left(coalesce(nullif(trim(p_attempt->>'nickname'), ''), '학생'), 40);
  v_class_code := left(coalesce(nullif(trim(p_attempt->>'classCode'), ''), v_set.access_code), 40);
  v_raw_completed_at := nullif(trim(p_attempt->>'completedAt'), '');

  if v_raw_completed_at is not null then
    begin
      v_completed_at := v_raw_completed_at::timestamptz;
    exception when others then
      v_completed_at := now();
    end;
  end if;

  insert into public.server_attempts (
    published_set_id,
    client_submission_id,
    access_code,
    nickname,
    class_code,
    completed_at,
    payload
  ) values (
    v_set.id,
    v_submission_id,
    v_set.access_code,
    v_nickname,
    v_class_code,
    v_completed_at,
    p_attempt
  )
  on conflict (published_set_id, client_submission_id)
  do update set
    nickname = excluded.nickname,
    class_code = excluded.class_code,
    completed_at = excluded.completed_at,
    payload = excluded.payload
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.get_backend_status() from public;
revoke all on function public.get_published_set(text) from public;
revoke all on function public.upsert_published_set(text, text, jsonb) from public;
revoke all on function public.submit_published_attempt(text, jsonb) from public;

grant execute on function public.get_backend_status() to anon, authenticated;
grant execute on function public.get_published_set(text) to anon, authenticated;
grant execute on function public.upsert_published_set(text, text, jsonb) to authenticated;
grant execute on function public.submit_published_attempt(text, jsonb) to anon, authenticated;

comment on table public.published_sets is '교사가 게시한 비버 과정평가 과제 스냅샷';
comment on table public.server_attempts is '학생의 완료된 과정평가 제출 기록';
