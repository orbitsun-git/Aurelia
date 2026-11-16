begin;
alter table public.aurelia_drive_secrets add column if not exists pin_cipher text;
drop function if exists public.aurelia_save_material(uuid,text,text,text,text,text,text,text,text,text,text);
create or replace function public.aurelia_save_material(
p_id uuid,p_course text,p_grade text,p_semester text,p_subject text,p_title text,p_description text,p_url text,p_preview text,p_salt text,p_hash text,p_cipher text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_scope text;
begin
v_scope:=json_build_array(p_course,p_grade,p_semester,p_subject)::text;
-- Match JSON.stringify scope keys already used by the server (no spaces).
v_scope:='[' || to_json(p_course)::text || ',' || to_json(p_grade)::text || ',' || to_json(p_semester)::text || ',' || to_json(p_subject)::text || ']';
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
 insert into public.aurelia_drive_secrets(scope_key,salt,pin_hash,pin_cipher) values(v_scope,p_salt,p_hash,p_cipher)
 on conflict(scope_key) do update set salt=excluded.salt,pin_hash=excluded.pin_hash,pin_cipher=excluded.pin_cipher;
elsif not exists(select 1 from public.aurelia_drive_secrets where scope_key=v_scope) then
 raise exception 'Set a 4-digit PIN for this subject';
end if;
return v_id;
end;$$;
revoke all on function public.aurelia_save_material(uuid,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.aurelia_save_material(uuid,text,text,text,text,text,text,text,text,text,text,text) to service_role;
commit;


