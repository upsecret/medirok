-- ============================================================
-- P3: 정리 — NOT NULL 승격 + 레거시 slug 컬럼/임베드 테이블 제거
-- 전제: P1 백필 완료 + P2(신 코드 배포·검증) 완료 + 검증 쿼리(런북 V1~V6) 전부 통과
-- ⚠ 이 단계 이후 구(舊) 코드는 동작하지 않는다 (롤백 지점은 P3 실행 전까지)
-- ============================================================

BEGIN;

-- ─── 1. 필수 관계 NOT NULL 승격 (백필 누락이 있으면 여기서 실패 = 안전장치) ───
ALTER TABLE public.hospitals ALTER COLUMN department_id SET NOT NULL;
ALTER TABLE public.hospitals ALTER COLUMN region_id SET NOT NULL;

-- ─── 2. 레거시 slug 컬럼 제거 ───
ALTER TABLE public.hospitals
  DROP COLUMN IF EXISTS department_slug,
  DROP COLUMN IF EXISTS sido_slug,
  DROP COLUMN IF EXISTS region_slug,
  DROP COLUMN IF EXISTS dong_slug;

ALTER TABLE public.regions DROP COLUMN IF EXISTS parent_slug;

ALTER TABLE public.magazines
  DROP COLUMN IF EXISTS author_doctor_slug,
  DROP COLUMN IF EXISTS linked_department_slug,
  DROP COLUMN IF EXISTS linked_region_slug;
-- linked_treatment_slug는 유지 (시술 컬렉션 도입 전까지 텍스트)

-- ─── 3. 임베드 의사 테이블 제거 (doctors 컬렉션으로 승격 완료) ───
DROP TABLE IF EXISTS public.hospitals_doctors_texts; -- 존재하는 경우만
DROP TABLE IF EXISTS public.hospitals_doctors;

-- ─── 4. hasMany 텍스트 레거시 행 제거 ───
-- linkedHospitalSlugs (magazines_rels로 이관 완료)
DELETE FROM public.magazines_texts WHERE path = 'linkedHospitalSlugs';
-- 레거시 doctors credentials — Q2 결과 변형 B: hospitals_texts에 path='doctors.<n>.credentials'
-- (doctors 컬렉션으로 승격 완료. hospitals의 현행 hasMany 텍스트인 path='tags'는 건드리지 않음)
DELETE FROM public.hospitals_texts WHERE path LIKE 'doctors.%.credentials';

COMMIT;
