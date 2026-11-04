-- Supabase SQL Editor에서 실행. 기존 lectures/learning_materials/comments는 변경하지 않습니다.
create table if not exists public.aurelia_resources (id uuid primary key default gen_random_uuid(), subject_id text not null, course text not null, grade text not null, semester text not null, kind text not null check(kind in ('lecture','material')), title text not null check(length(title) between 1 and 200), description text default '', url text not null check(url like 'https://%'), created_at timestamptz not null default now());
create table if not exists public.aurelia_books (id uuid primary key default gen_random_uuid(), subject_id text not null, course text not null, grade text not null, semester text not null, title text not null check(length(title) between 1 and 200), description text default '', contents text default '', cover_url text default '', purchase_url text default '', stage integer not null check(stage between 1 and 4), sort_order integer not null default 0, created_at timestamptz not null default now());
create table if not exists public.aurelia_posts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), title text not null check(length(trim(title)) between 1 and 120), content text not null check(length(trim(content)) between 1 and 2000), created_at timestamptz not null default now());
alter table public.aurelia_resources enable row level security;
drop policy if exists "read" on public.aurelia_resources;
create policy "read" on public.aurelia_resources for select to anon,authenticated using (true);
drop policy if exists "admin_write" on public.aurelia_resources;
create policy "admin_write" on public.aurelia_resources for all to authenticated using ((select auth.jwt())->'app_metadata'->>'role'='admin') with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
grant select on public.aurelia_resources to anon,authenticated;
grant insert,update,delete on public.aurelia_resources to authenticated;
alter table public.aurelia_books enable row level security;
drop policy if exists "read" on public.aurelia_books;
create policy "read" on public.aurelia_books for select to anon,authenticated using (true);
drop policy if exists "admin_write" on public.aurelia_books;
create policy "admin_write" on public.aurelia_books for all to authenticated using ((select auth.jwt())->'app_metadata'->>'role'='admin') with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
grant select on public.aurelia_books to anon,authenticated;
grant insert,update,delete on public.aurelia_books to authenticated;
alter table public.aurelia_posts enable row level security;
drop policy if exists "read" on public.aurelia_posts;
create policy "read" on public.aurelia_posts for select to anon,authenticated using (true);
drop policy if exists "student_insert" on public.aurelia_posts;
create policy "student_insert" on public.aurelia_posts for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "admin_delete" on public.aurelia_posts;
create policy "admin_delete" on public.aurelia_posts for delete to authenticated using ((select auth.jwt())->'app_metadata'->>'role'='admin');
grant select on public.aurelia_posts to anon,authenticated;
grant insert,delete on public.aurelia_posts to authenticated;

-- 관리자 지정: Authentication에서 이메일/비밀번호 사용자를 먼저 만든 뒤, 아래 이메일을 바꿔 주석을 해제하고 실행하세요.
-- update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"admin"}'::jsonb where email='실제관리자이메일';
-- 지정 후에는 사이트에서 로그아웃하고 다시 로그인하세요.

-- v2: 과목별 공용 테마. 읽기는 공개, 변경은 관리자만 가능.
alter table public.aurelia_resources add column if not exists storage_path text;
create table if not exists public.aurelia_page_themes(page_key text primary key,theme text not null check(theme in ('desert','city','ocean','plane','mountain','winter','autumn','beach','spring','highway')));
alter table public.aurelia_page_themes enable row level security;
drop policy if exists "theme_read" on public.aurelia_page_themes;
create policy "theme_read" on public.aurelia_page_themes for select to anon,authenticated using(true);
drop policy if exists "theme_admin" on public.aurelia_page_themes;
create policy "theme_admin" on public.aurelia_page_themes for all to authenticated using ((select auth.jwt())->'app_metadata'->>'role'='admin') with check ((select auth.jwt())->'app_metadata'->>'role'='admin');
grant select on public.aurelia_page_themes to anon,authenticated;
grant insert,update,delete on public.aurelia_page_themes to authenticated;
-- 파일은 공개 열람용입니다. 비공개 자료에는 signed URL 방식이 별도로 필요합니다.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('aurelia-files','aurelia-files',true,52428800,array['video/mp4','video/webm','application/pdf','image/png','image/jpeg','image/webp']) on conflict(id) do update set public=true,file_size_limit=52428800,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "aurelia_upload" on storage.objects;
create policy "aurelia_upload" on storage.objects for insert to authenticated with check(bucket_id='aurelia-files' and (select auth.jwt())->'app_metadata'->>'role'='admin');
drop policy if exists "aurelia_file_delete" on storage.objects;
create policy "aurelia_file_delete" on storage.objects for delete to authenticated using(bucket_id='aurelia-files' and (select auth.jwt())->'app_metadata'->>'role'='admin');


