-- 먼저 기존 aurelia-update.sql의 과목 테이블/정책이 준비되어 있어야 합니다.
-- 최초 적용용: 기본 과목을 한 번 등록합니다. 삭제 후 다시 실행하면 기본 과목이 재등록됩니다.
BEGIN;
INSERT INTO public.aurelia_subjects(subject_id,name,course,grade,semester) VALUES
('reading','독서와작문','내신','2학년','2학기'),
('english2','영어2','내신','2학년','2학기'),
('calculus2','미적분2','내신','2학년','2학기'),
('genetics','생물의유전','내신','2학년','2학기'),
('chemistry','화학','내신','2학년','2학기'),
('ethics','현대사회와윤리','내신','2학년','2학기'),
('csat-korean','국어','수능','공통','공통'),
('csat-math','수학','수능','공통','공통'),
('csat-english','영어','수능','공통','공통'),
('csat-social','통합사회','수능','공통','공통'),
('csat-science','통합과학','수능','공통','공통'),
('csat-history','한국사','수능','공통','공통')
ON CONFLICT DO NOTHING;
COMMIT;
