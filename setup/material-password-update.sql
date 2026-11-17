begin;
create table if not exists public.aurelia_material_secrets (
id uuid primary key references public.aurelia_resources(id) on delete cascade,
salt text not null,pin_hash text not null);
alter table public.aurelia_material_secrets enable row level security;
revoke all on public.aurelia_material_secrets from public,anon,authenticated;
grant all on public.aurelia_material_secrets to service_role;
-- Preserve existing subject PINs independently for each existing link.
insert into public.aurelia_material_secrets(id,salt,pin_hash)
select r.id,s.salt,s.pin_hash from public.aurelia_resources r
join public.aurelia_drive_secrets s on s.scope_key::jsonb=jsonb_build_array(r.course,r.grade,r.semester,r.subject_id)
where r.kind='material' on conflict(id) do nothing;
create or replace function public.aurelia_save_material(
p_id uuid,p_course text,p_grade text,p_semester text,p_subject text,p_title text,p_description text,p_url text,p_preview text,p_salt text,p_hash text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
if p_url not like 'https://%' then raise exception 'HTTPS URL required'; end if;
if p_id is null then
 if p_hash is null or p_salt is null then raise exception 'PIN required'; end if;
 insert into public.aurelia_resources(course,grade,semester,subject_id,kind,title,description,url,preview_title,preview_image)
 values(p_course,p_grade,p_semester,p_subject,'material',p_title,p_description,p_url,p_title,p_preview) returning id into v_id;
else
 update public.aurelia_resources set course=p_course,grade=p_grade,semester=p_semester,subject_id=p_subject,title=p_title,description=p_description,url=p_url,preview_title=p_title,preview_image=p_preview
 where id=p_id and kind='material' returning id into v_id;
 if v_id is null then raise exception 'Material not found'; end if;
end if;
if p_hash is not null and p_salt is not null then
 insert into public.aurelia_material_secrets(id,salt,pin_hash) values(v_id,p_salt,p_hash)
 on conflict(id) do update set salt=excluded.salt,pin_hash=excluded.pin_hash;
elsif not exists(select 1 from public.aurelia_material_secrets where id=v_id) then
 raise exception 'Set a 4-digit PIN for this material';
end if;
return v_id;
end;$$;
revoke all on function public.aurelia_save_material(uuid,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.aurelia_save_material(uuid,text,text,text,text,text,text,text,text,text,text) to service_role;
commit;


