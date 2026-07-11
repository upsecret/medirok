-- ============================================================
-- P1: 트랜지셔널 스키마 — 신규 테이블/FK 컬럼 추가 + 데이터 백필
-- (레거시 컬럼은 유지 → 구 코드/신 코드 모두 동작하는 상태)
--
-- 대상: 운영 Neon (반드시 Neon 브랜치에서 먼저 리허설)
-- 사전: docs/prod-migration-runbook.md의 "사전 확인" 쿼리 결과 확인
-- DDL 이름들은 로컬 최종 스키마(payload push 결과)에서 추출 — drizzle 관례와 일치
-- ============================================================

BEGIN;

-- ─── 1. doctors 컬렉션 테이블 ───
CREATE TABLE IF NOT EXISTS public.doctors (
  id serial PRIMARY KEY,
  slug varchar NOT NULL,
  name_kr varchar NOT NULL,
  name_hanja varchar,
  title varchar,
  years_experience numeric,
  specialty varchar,
  hospital_id integer,
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT doctors_hospital_id_hospitals_id_fk
    FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS doctors_slug_idx ON public.doctors (slug);
CREATE INDEX IF NOT EXISTS doctors_hospital_idx ON public.doctors (hospital_id);
CREATE INDEX IF NOT EXISTS doctors_created_at_idx ON public.doctors (created_at);
CREATE INDEX IF NOT EXISTS doctors_updated_at_idx ON public.doctors (updated_at);

-- credentials(hasMany text) 저장 테이블
CREATE TABLE IF NOT EXISTS public.doctors_texts (
  id serial PRIMARY KEY,
  "order" integer NOT NULL,
  parent_id integer NOT NULL,
  path varchar NOT NULL,
  text varchar,
  CONSTRAINT doctors_texts_parent_fk
    FOREIGN KEY (parent_id) REFERENCES public.doctors(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS doctors_texts_order_parent ON public.doctors_texts ("order", parent_id);

-- ─── 2. magazines_rels (linkedHospitals hasMany 관계 테이블) ───
CREATE TABLE IF NOT EXISTS public.magazines_rels (
  id serial PRIMARY KEY,
  "order" integer,
  parent_id integer NOT NULL,
  path varchar NOT NULL,
  hospitals_id integer,
  CONSTRAINT magazines_rels_parent_fk
    FOREIGN KEY (parent_id) REFERENCES public.magazines(id) ON DELETE CASCADE,
  CONSTRAINT magazines_rels_hospitals_fk
    FOREIGN KEY (hospitals_id) REFERENCES public.hospitals(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS magazines_rels_order_idx ON public.magazines_rels ("order");
CREATE INDEX IF NOT EXISTS magazines_rels_parent_idx ON public.magazines_rels (parent_id);
CREATE INDEX IF NOT EXISTS magazines_rels_path_idx ON public.magazines_rels (path);
CREATE INDEX IF NOT EXISTS magazines_rels_hospitals_id_idx ON public.magazines_rels (hospitals_id);

-- ─── 3. FK 컬럼 추가 (레거시 slug 컬럼과 병존) ───
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS department_id integer;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS region_id integer;
ALTER TABLE public.regions   ADD COLUMN IF NOT EXISTS parent_id integer;
ALTER TABLE public.magazines ADD COLUMN IF NOT EXISTS author_doctor_id integer;
ALTER TABLE public.magazines ADD COLUMN IF NOT EXISTS linked_department_id integer;
ALTER TABLE public.magazines ADD COLUMN IF NOT EXISTS linked_region_id integer;

DO $$ BEGIN
  ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_department_id_departments_id_fk
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_region_id_regions_id_fk
    FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.regions ADD CONSTRAINT regions_parent_id_regions_id_fk
    FOREIGN KEY (parent_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.magazines ADD CONSTRAINT magazines_author_doctor_id_doctors_id_fk
    FOREIGN KEY (author_doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.magazines ADD CONSTRAINT magazines_linked_department_id_departments_id_fk
    FOREIGN KEY (linked_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.magazines ADD CONSTRAINT magazines_linked_region_id_regions_id_fk
    FOREIGN KEY (linked_region_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS hospitals_department_idx ON public.hospitals (department_id);
CREATE INDEX IF NOT EXISTS hospitals_region_idx ON public.hospitals (region_id);
CREATE INDEX IF NOT EXISTS regions_parent_idx ON public.regions (parent_id);
CREATE INDEX IF NOT EXISTS magazines_author_doctor_idx ON public.magazines (author_doctor_id);
CREATE INDEX IF NOT EXISTS magazines_linked_department_idx ON public.magazines (linked_department_id);
CREATE INDEX IF NOT EXISTS magazines_linked_region_idx ON public.magazines (linked_region_id);

-- Payload 어드민 문서 잠금 테이블에 doctors 참조 추가
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS doctors_id integer;
DO $$ BEGIN
  ALTER TABLE public.payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_doctors_fk
    FOREIGN KEY (doctors_id) REFERENCES public.doctors(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_doctors_id_idx
  ON public.payload_locked_documents_rels (doctors_id);

-- ─── 4. 데이터 백필 (멱등) ───

-- 4a. 임베드 의사 → doctors 승격
--     ⚠ 사전 확인: 임베드 테이블명이 hospitals_doctors인지 (런북 Q1 쿼리)
INSERT INTO public.doctors (slug, name_kr, name_hanja, title, years_experience, specialty, hospital_id)
SELECT hd.slug, hd.name_kr, hd.name_hanja, hd.title, hd.years_experience, hd.specialty, hd._parent_id
FROM public.hospitals_doctors hd
ON CONFLICT (slug) DO UPDATE SET
  name_kr = EXCLUDED.name_kr,
  name_hanja = EXCLUDED.name_hanja,
  title = EXCLUDED.title,
  years_experience = EXCLUDED.years_experience,
  specialty = EXCLUDED.specialty,
  hospital_id = EXCLUDED.hospital_id;

-- 4b. 의사 credentials 이관
--     사전 확인(2026-07-11, 런북 Q2): hospitals_doctors_texts 없음 →
--     [변형 B] hospitals_texts에 path='doctors.<0-기반 인덱스>.credentials'로 저장됨.
--     hospitals_doctors._order는 1-기반이므로 (_order - 1)로 path 인덱스 매칭.
INSERT INTO public.doctors_texts ("order", parent_id, path, text)
SELECT ht."order", d.id, 'credentials', ht.text
FROM public.hospitals_texts ht
JOIN public.hospitals_doctors hd
  ON hd._parent_id = ht.parent_id
 AND ht.path = 'doctors.' || (hd._order - 1)::text || '.credentials'
JOIN public.doctors d ON d.slug = hd.slug
WHERE ht.path LIKE 'doctors.%.credentials'
  AND NOT EXISTS (
    SELECT 1 FROM public.doctors_texts x
    WHERE x.parent_id = d.id AND x.path = 'credentials' AND x.text = ht.text
  );

-- 4c. hospitals FK
UPDATE public.hospitals h SET department_id = d.id
FROM public.departments d
WHERE d.slug = h.department_slug AND h.department_id IS NULL;

UPDATE public.hospitals h SET region_id = r.id
FROM public.regions r
WHERE r.slug = COALESCE(NULLIF(h.dong_slug, ''), h.region_slug) AND h.region_id IS NULL;

-- 4d. regions 부모 체인
UPDATE public.regions c SET parent_id = p.id
FROM public.regions p
WHERE p.slug = c.parent_slug AND NULLIF(c.parent_slug, '') IS NOT NULL AND c.parent_id IS NULL;

-- 4e. magazines FK
UPDATE public.magazines m SET author_doctor_id = d.id
FROM public.doctors d
WHERE d.slug = m.author_doctor_slug AND NULLIF(m.author_doctor_slug,'') IS NOT NULL AND m.author_doctor_id IS NULL;

UPDATE public.magazines m SET linked_department_id = d.id
FROM public.departments d
WHERE d.slug = m.linked_department_slug AND NULLIF(m.linked_department_slug,'') IS NOT NULL AND m.linked_department_id IS NULL;

-- linked_region: slug 직매칭 → (레거시 영문 slug 대비) name_en 소문자 fallback
-- + 접미사 제거 fallback: 'gangnam' vs name_en 'Gangnam-gu' (사전 확인 Q5에서 발견)
UPDATE public.magazines m SET linked_region_id = COALESCE(
  (SELECT r.id FROM public.regions r WHERE r.slug = m.linked_region_slug LIMIT 1),
  (SELECT r.id FROM public.regions r WHERE lower(r.name_en) = lower(m.linked_region_slug) LIMIT 1),
  (SELECT r.id FROM public.regions r
   WHERE lower(regexp_replace(r.name_en, '-(gu|si|gun|do)$', '', 'i')) = lower(m.linked_region_slug) LIMIT 1)
)
WHERE NULLIF(m.linked_region_slug,'') IS NOT NULL AND m.linked_region_id IS NULL;

-- 4f. linkedHospitalSlugs(hasMany text) → magazines_rels
--     ⚠ 사전 확인(런북 Q3): magazines_texts의 path 값이 'linkedHospitalSlugs'인지
INSERT INTO public.magazines_rels ("order", parent_id, path, hospitals_id)
SELECT mt."order", mt.parent_id, 'linkedHospitals', h.id
FROM public.magazines_texts mt
JOIN public.hospitals h ON h.slug = mt.text
WHERE mt.path = 'linkedHospitalSlugs'
  AND NOT EXISTS (
    SELECT 1 FROM public.magazines_rels mr
    WHERE mr.parent_id = mt.parent_id AND mr.path = 'linkedHospitals' AND mr.hospitals_id = h.id
  );

COMMIT;
