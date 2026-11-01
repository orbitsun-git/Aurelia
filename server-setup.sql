-- 학습 자료용 새 테이블 설정 예시 (Supabase SQL Editor)
-- 기존 lectures/comments 테이블과 기존 정책은 변경하지 않습니다.
-- 실행 전에 기존 설정을 확인하세요. 자료는 공개 열람 용도입니다.
-- 관리자 쓰기는 실제 Supabase Auth 로그인과 서버에서 부여한
-- app_metadata.role = 'admin'이 있어야 합니다.
-- 기존 화면 비밀번호/sessionStorage 인증은 이 권한을 부여하지 않습니다.

create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  file_url text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/png','image/jpeg','application/pdf')),
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.learning_materials enable row level security;
grant select on public.learning_materials to anon, authenticated;
grant insert on public.learning_materials to authenticated;

drop policy if exists gold_materials_read on public.learning_materials;
create policy gold_materials_read on public.learning_materials for select to anon, authenticated using (true);
drop policy if exists gold_materials_admin_insert on public.learning_materials;
create policy gold_materials_admin_insert on public.learning_materials for insert to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 기존 bucket이 있으면 기존 공개 설정/용량 제한을 덮어쓰지 않습니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lecture-files', 'lecture-files', true, 10485760, array['image/png','image/jpeg','application/pdf'])
on conflict (id) do nothing;

drop policy if exists gold_material_objects_read on storage.objects;
create policy gold_material_objects_read on storage.objects for select to anon, authenticated
using (bucket_id = 'lecture-files');
drop policy if exists gold_material_objects_admin_insert on storage.objects;
create policy gold_material_objects_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'lecture-files' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists gold_material_objects_admin_delete on storage.objects;
create policy gold_material_objects_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'lecture-files' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 주의: PostgreSQL의 허용 정책은 서로 OR로 합쳐집니다.
-- 기존에 누구나 쓰기를 허용하는 별도 정책이 있다면 이 SQL만으로
-- 그 권한이 취소되지 않습니다. lectures/comments/storage 기존 정책은
-- 별도로 점검해야 합니다. 이 스크립트는 완전한 사이트 보안 설정이 아닙니다.

-- 영상 직접 업로드용. 프로젝트 전역 파일 크기 제한도 1GB 이상이어야 합니다.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('lecture-videos','lecture-videos',true,1000000000,array['video/mp4','video/webm'])
on conflict (id) do update set public=true,file_size_limit=1000000000,allowed_mime_types=array['video/mp4','video/webm'];
create table if not exists public.lectures (
 id uuid primary key default gen_random_uuid(),subject_id text not null,title text not null,
 description text,video_url text not null,created_at timestamptz not null default now()
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),subject_id text not null,author_name text not null,
 content text not null check(char_length(content) between 1 and 2000),created_at timestamptz not null default now()
);
alter table public.lectures enable row level security;
alter table public.comments enable row level security;
grant select on public.lectures, public.comments to anon,authenticated;
grant insert on public.lectures to authenticated;
grant insert on public.comments to anon,authenticated;
drop policy if exists gold_lectures_read on public.lectures;
create policy gold_lectures_read on public.lectures for select to anon,authenticated using(true);
drop policy if exists gold_lectures_admin_insert on public.lectures;
create policy gold_lectures_admin_insert on public.lectures for insert to authenticated
with check((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists gold_comments_read on public.comments;
create policy gold_comments_read on public.comments for select to anon,authenticated using(true);
drop policy if exists gold_comments_insert on public.comments;
create policy gold_comments_insert on public.comments for insert to anon,authenticated
with check(author_name='익명 학생' and char_length(content) between 1 and 2000);
drop policy if exists gold_video_read on storage.objects;
create policy gold_video_read on storage.objects for select to anon,authenticated using(bucket_id='lecture-videos');
drop policy if exists gold_video_insert on storage.objects;
create policy gold_video_insert on storage.objects for insert to authenticated
with check(bucket_id='lecture-videos' and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists gold_video_delete on storage.objects;
create policy gold_video_delete on storage.objects for delete to authenticated
using(bucket_id='lecture-videos' and (auth.jwt()->'app_metadata'->>'role')='admin');
-- 댓글은 공개 익명 작성: 스팸 방지/신고/속도 제한은 별도 서버 작업 필요.
-- 기존 테이블이 다른 구조라면 create table if not exists로 열이 추가되지 않습니다.
-- 기존 허용 정책은 OR로 작동하므로 기존 과도한 쓰기 정책은 별도 검토해야 합니다.
