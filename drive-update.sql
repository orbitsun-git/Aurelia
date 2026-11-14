begin;
create table if not exists public.aurelia_drive_pdfs(id uuid primary key default gen_random_uuid(),title text not null,description text default '',subject_id text not null,course text not null,grade text not null,semester text not null,scope_key text not null,created_at timestamptz default now());
create table if not exists public.aurelia_drive_links(id uuid primary key references public.aurelia_drive_pdfs on delete cascade,file_id text not null);
create table if not exists public.aurelia_drive_secrets(scope_key text primary key,salt text not null,pin_hash text not null);
create table if not exists public.aurelia_drive_pending(id uuid primary key default gen_random_uuid(),scope_key text not null,title text not null,description text,scope jsonb not null,size bigint not null,created_at timestamptz default now());
create table if not exists public.aurelia_drive_attempts(key text primary key,started timestamptz not null default now(),n integer not null default 0);
alter table public.aurelia_drive_pdfs enable row level security;
alter table public.aurelia_drive_links enable row level security;
alter table public.aurelia_drive_secrets enable row level security;
alter table public.aurelia_drive_pending enable row level security;
alter table public.aurelia_drive_attempts enable row level security;
drop policy if exists drive_metadata_read on public.aurelia_drive_pdfs;
create policy drive_metadata_read on public.aurelia_drive_pdfs for select to anon,authenticated using(true);
grant select on public.aurelia_drive_pdfs to anon,authenticated;
revoke all on public.aurelia_drive_links,public.aurelia_drive_secrets,public.aurelia_drive_pending,public.aurelia_drive_attempts from anon,authenticated;
grant all on public.aurelia_drive_pdfs,public.aurelia_drive_links,public.aurelia_drive_secrets,public.aurelia_drive_pending,public.aurelia_drive_attempts to service_role;
create or replace function public.aurelia_drive_attempt(attempt_key text) returns boolean language plpgsql security definer set search_path=public as $$
declare v integer;
begin
insert into aurelia_drive_attempts as a(key,started,n) values(attempt_key,now(),1)
on conflict(key) do update set n=case when a.started<now()-interval '10 minutes' then 1 else a.n+1 end,started=case when a.started<now()-interval '10 minutes' then now() else a.started end returning n into v;
return v<=10;
end;$$;
revoke all on function public.aurelia_drive_attempt(text) from public,anon,authenticated;
grant execute on function public.aurelia_drive_attempt(text) to service_role;
commit;
