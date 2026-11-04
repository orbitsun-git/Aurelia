-- 기존 데이터는 삭제하지 않습니다. Supabase SQL Editor에서 한 번 실행하세요.
alter table public.aurelia_books add column if not exists category text;
alter table public.aurelia_books add column if not exists publisher text;
alter table public.aurelia_books add column if not exists edition text;
alter table public.aurelia_books add column if not exists difficulty text;
alter table public.aurelia_books add column if not exists difficulty_reason text;
alter table public.aurelia_books add column if not exists recommended_for text;
-- stage는 기존 구조 호환을 위해 유지하며 새 화면에는 표시하지 않습니다.
alter table public.aurelia_books alter column stage set default 1;
