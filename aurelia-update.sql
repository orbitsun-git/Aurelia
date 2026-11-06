-- 기존 server-setup.sql이 적용된 프로젝트용. 기존 글/자료/계정 삭제 없음.
begin;
create table if not exists public.aurelia_subjects (
 subject_id text primary key, name text not null check(length(trim(name)) between 1 and 60),
 course text not null check(course in ('내신','수능')),grade text not null,semester text not null,
 created_at timestamptz not null default now(),unique(course,grade,semester,name),
 check((course='수능' and grade='공통' and semester='공통') or (course='내신' and grade in ('1학년','2학년','3학년') and semester in ('1학기','2학기')))
);
alter table public.aurelia_subjects enable row level security;
drop policy if exists subjects_read on public.aurelia_subjects;
create policy subjects_read on public.aurelia_subjects for select to anon,authenticated using(true);
drop policy if exists subjects_admin on public.aurelia_subjects;
create policy subjects_admin on public.aurelia_subjects for all to authenticated using((select auth.jwt())->'app_metadata'->>'role'='admin') with check((select auth.jwt())->'app_metadata'->>'role'='admin');
grant select on public.aurelia_subjects to anon,authenticated;
grant insert,update,delete on public.aurelia_subjects to authenticated;
alter table public.aurelia_posts add column if not exists category text not null default 'QnA';
alter table public.aurelia_posts drop constraint if exists aurelia_posts_category_check;
alter table public.aurelia_posts add constraint aurelia_posts_category_check check(category in ('QnA','문제집 오류 문의','공지사항'));
-- 이전 student_insert 정책을 반드시 교체: 학생 공지 작성 차단.
drop policy if exists student_insert on public.aurelia_posts;
create policy student_insert on public.aurelia_posts for insert to authenticated with check(
 user_id=(select auth.uid()) and (category in ('QnA','문제집 오류 문의') or (category='공지사항' and (select auth.jwt())->'app_metadata'->>'role'='admin'))
);
drop policy if exists admin_delete on public.aurelia_posts;
create policy admin_delete on public.aurelia_posts for delete to authenticated using((select auth.jwt())->'app_metadata'->>'role'='admin');
create index if not exists aurelia_posts_category_date on public.aurelia_posts(category,created_at desc);
create table if not exists public.aurelia_comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.aurelia_posts(id) on delete cascade,user_id uuid not null references auth.users(id),content text not null check(length(trim(content)) between 1 and 1000),created_at timestamptz not null default now());
create table if not exists public.aurelia_likes(post_id uuid not null references public.aurelia_posts(id) on delete cascade,user_id uuid not null references auth.users(id),created_at timestamptz not null default now(),primary key(post_id,user_id));
alter table public.aurelia_comments enable row level security;
alter table public.aurelia_likes enable row level security;
drop policy if exists comments_read on public.aurelia_comments;
create policy comments_read on public.aurelia_comments for select to anon,authenticated using(true);
drop policy if exists comments_insert on public.aurelia_comments;
create policy comments_insert on public.aurelia_comments for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists comments_delete on public.aurelia_comments;
create policy comments_delete on public.aurelia_comments for delete to authenticated using((select auth.jwt())->'app_metadata'->>'role'='admin');
drop policy if exists likes_read on public.aurelia_likes;
create policy likes_read on public.aurelia_likes for select to anon,authenticated using(true);
drop policy if exists likes_insert on public.aurelia_likes;
create policy likes_insert on public.aurelia_likes for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists likes_delete on public.aurelia_likes;
create policy likes_delete on public.aurelia_likes for delete to authenticated using(user_id=(select auth.uid()));
grant select on public.aurelia_comments,public.aurelia_likes to anon,authenticated;
grant insert,delete on public.aurelia_comments,public.aurelia_likes to authenticated;
commit;
