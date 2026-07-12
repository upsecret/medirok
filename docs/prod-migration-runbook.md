# 운영(Neon) slug→FK 마이그레이션 런북

작성일: 2026-07-04 · 실행 주체: Claude CLI (사람 확인 게이트 포함) · SQL: `sql/prod-fk-migration/`

## 0. 개요 — 3단계 무중단 전략

리포 코드는 이미 최종(FK) 스키마이고, **운영 Neon DB는 구(slug) 스키마**다. 다음 3단계로 적용한다:

```
P1  트랜지셔널: 신규 테이블/FK 컬럼 추가 + 백필  ← 구 코드 계속 동작 (새 컬럼 무시)
P2  신 코드 배포 + 스모크 검증                   ← 신 코드는 관계만 읽음 (레거시 컬럼 무시)
P3  정리: NOT NULL 승격 + 레거시 컬럼/테이블 DROP ← 이후 구 코드 롤백 불가
```

P1↔P2 사이, P2↔P3 사이가 롤백 가능 구간이다. **모든 단계는 Neon 브랜치에서 먼저 리허설**하고, 검증 통과 후에만 본 DB에 적용한다.

## 1. 사전 준비

```bash
# Neon 브랜치 생성 (리허설용) — 콘솔 또는 neonctl
neonctl branches create --name fk-migration-rehearsal
# 브랜치 연결 문자열을 환경변수로
export REHEARSAL_URL="postgresql://...branch..."
```

psql 접속은 `psql "$REHEARSAL_URL"`. 본 DB 접근 문자열은 `.env.local`의 `DATABASE_URL`.

### 사전 확인 쿼리 (브랜치에서 실행 — 결과를 기록할 것)

```sql
-- Q1. 임베드 의사 테이블명 확인 (기대: hospitals_doctors, 컬럼 _parent_id 존재)
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name LIKE 'hospitals%';
SELECT column_name FROM information_schema.columns WHERE table_name='hospitals_doctors';

-- Q2. 의사 credentials 저장 위치 확인
--     hospitals_doctors_texts 테이블이 있으면 → p1 4b [변형 A]
--     없고 hospitals_texts에 doctors 관련 path가 있으면 → [변형 B] (path 값 기록)
SELECT DISTINCT path FROM hospitals_texts;

-- Q3. 매거진 hasMany 텍스트 path 확인 (기대: linkedHospitalSlugs, targetKeywords)
SELECT DISTINCT path FROM magazines_texts;

-- Q4. 레거시 데이터 분포 (백필 기대치 산정)
SELECT count(*) hospitals, count(department_slug) dept_slug, count(region_slug) region_slug FROM hospitals;
SELECT count(*) FROM hospitals_doctors;
SELECT count(*) regions, count(NULLIF(parent_slug,'')) with_parent FROM regions;
SELECT count(*) magazines, count(NULLIF(author_doctor_slug,'')) with_author,
       count(NULLIF(linked_region_slug,'')) with_region FROM magazines;

-- Q5. 지역 slug 체계 확인 (한국어여야 함 — migrate-korean-urls 적용 여부)
SELECT slug, level FROM regions ORDER BY level, slug LIMIT 20;
```

Q1~Q3 결과가 기대와 다르면 `p1-add-and-backfill.sql`의 4a/4b/4f 주석 지시에 따라 해당 구문을 조정한다. Q5에서 영문 slug가 남아 있으면 먼저 `scripts/migrate-korean-urls.ts` 적용 여부를 조사한다 (매거진 `linked_region_slug`의 영문 잔재는 p1의 name_en fallback이 처리).

## 2. P1 — 스키마 추가 + 백필 (브랜치 → 본 DB 순)

```bash
psql "$REHEARSAL_URL" -f sql/prod-fk-migration/p1-add-and-backfill.sql
```

전체가 하나의 트랜잭션 — 중간 실패 시 자동 롤백. 4b(credentials)는 Q2 결과에 맞는 변형의 주석을 해제하고 실행.

### P1 검증 쿼리 (전부 통과해야 P2 진행)

```sql
-- V1. 필수 관계 NULL 0건
SELECT count(*) FROM hospitals WHERE department_id IS NULL OR region_id IS NULL;  -- = 0
-- V2. 지역 부모 체인: 시도 제외 전부 parent
SELECT count(*) FROM regions WHERE level <> 'sido' AND parent_id IS NULL;         -- = 0
-- V3. 의사 승격 수 = 임베드 수 (slug 중복 없다면)
SELECT (SELECT count(*) FROM doctors) AS doctors, (SELECT count(*) FROM hospitals_doctors) AS embeds;
SELECT count(*) FROM doctors WHERE hospital_id IS NULL;                           -- = 0
-- V4. 매거진 관계: 레거시 slug가 있는데 관계가 비면 백필 실패
SELECT count(*) FROM magazines WHERE NULLIF(author_doctor_slug,'') IS NOT NULL AND author_doctor_id IS NULL;   -- = 0
SELECT count(*) FROM magazines WHERE NULLIF(linked_region_slug,'') IS NOT NULL AND linked_region_id IS NULL;   -- = 0
-- V5. linkedHospitals 이관 수 = 레거시 텍스트 수
SELECT (SELECT count(*) FROM magazines_rels WHERE path='linkedHospitals') AS rels,
       (SELECT count(*) FROM magazines_texts WHERE path='linkedHospitalSlugs') AS texts;
-- V6. FK 무결성 (정의상 보장되지만 확인)
SELECT conname FROM pg_constraint WHERE contype='f' AND NOT convalidated;         -- 0 rows
```

브랜치 통과 → **본 DB에 동일 실행 + 동일 검증**. (P1은 additive라 무중단; 구 코드는 영향 없음)

## 3. P2 — 신 코드 배포 + 스모크

1. 리포 커밋/푸시 → 배포 (Vercel 등). 신 코드는 관계 컬럼만 읽는다(payload-mappers가 FK 체인에서 flat slug 파생).
2. 스모크: 읽기 전용 e2e를 운영 URL에 직접 실행 (쓰기 없음 — dashboard 스펙 제외):

```bash
PLAYWRIGHT_BASE_URL=https://medirok.com npx playwright test \
  e2e/seo.spec.ts e2e/home.spec.ts e2e/hospitals.spec.ts \
  e2e/local-seo.spec.ts e2e/magazine.spec.ts e2e/static-pages.spec.ts \
  --project=chromium --workers=1
```

3. /admin에서 병원 1건 열어 진료과·지역·의사 관계 표시/저장 확인, 매거진 1건에서 저자·연결 병원 확인.
4. 실패 시 롤백: 이전 배포로 되돌리면 끝 (DB는 트랜지셔널이라 구 코드 호환).

## 4. P3 — 정리 (레거시 제거)

P2 안정 확인 후(권장: 1일 이상 운영):

```bash
psql "$REHEARSAL_URL" -f sql/prod-fk-migration/p3-cleanup.sql   # 브랜치 리허설
psql "$DATABASE_URL"  -f sql/prod-fk-migration/p3-cleanup.sql   # 본 DB
```

NOT NULL 승격이 첫 구문이므로 백필 누락이 있으면 트랜잭션 전체가 실패한다(안전장치). **P3 이후 구 코드 롤백 불가** — 복구는 Neon PITR/브랜치 복원으로만 가능.

## 5. 마이그레이션 베이스라인 (향후 스키마 변경 대비)

지금까지는 dev push로 스키마를 관리했다. 운영에 마이그레이션 이력을 남기려면:

```bash
# 1) 최종 스키마 스냅샷 마이그레이션 생성 (로컬, 커밋)
npx payload migrate:create init
# 2) 운영 DB는 이미 최종 스키마이므로 실행하지 않고 '적용됨'으로 마킹 (baseline)
psql "$DATABASE_URL" -c "INSERT INTO payload_migrations (name, batch, created_at, updated_at)
  VALUES ('<생성된 파일명, 확장자 제외>', 1, now(), now());"
# (사전에 \d payload_migrations 로 컬럼 구성 확인)
```

이후 스키마 변경은 `payload migrate:create` → `payload migrate` 흐름으로 관리한다.

## 6. 체크리스트 요약

- [ ] Neon 브랜치 생성, 사전 확인 Q1~Q5 기록
- [ ] (필요 시) p1 4b/4f 변형 조정
- [ ] 브랜치 P1 실행 + V1~V6 통과
- [ ] 본 DB P1 실행 + V1~V6 통과
- [ ] 신 코드 배포(P2) + 운영 스모크 e2e + admin 확인
- [x] 안정 기간 경과 후 브랜치 P3 리허설 → 본 DB P3
- [x] 마이그레이션 베이스라인 생성·마킹
- [x] 리허설 브랜치 삭제 (로컬 컨테이너 중지 — 백업 덤프 보존으로 대체)

## 7. 실행 기록 (2026-07-11)

- 리허설: neonctl 부재로 Neon 브랜치 대신 **운영 pg_dump → 로컬 docker postgres:17 복원**으로 대체 (검증 목적 동일). 사전 백업 덤프 확보.
- 사전 확인 결과: Q1 `hospitals_doctors`(_order 1-기반) ✓ · Q2 **변형 B** (`hospitals_texts`, path=`doctors.<0-기반>.credentials`) → p1 4b 작성 · Q3 ✓ · Q5 한국어 slug ✓ (매거진에 `gangnam` 영문 잔재 → p1 4e에 `-gu/-si/-gun/-do` 접미사 제거 fallback 추가).
- P1 결과(리허설·운영 동일): doctors 18, credentials 79, hospitals FK 2/2, regions parent 32, magazines dept 12·region 4, linkedHospitals rels 2.
- 검증: V1·V2·V3·V6 전부 통과. **V4 저자 4건 / V5 rels 2 vs texts 15는 dangling 레거시 참조** — `han-jinwoo`·`lee-dohyun`·`songhak-park`(의사), `hangyeol-dental`·`songhak-dental`·`myungheon-dental`(병원)이 운영 DB에 원래 존재하지 않음. 구 코드에서도 미렌더였고 신 코드는 authorName fallback으로 동일 동작 → 백필 실패 아님으로 판정.
- P2 사전 리허설: 신 코드를 복제 DB에 연결해 `next build` + 프로덕션 서버 기동, 주요 페이지(홈/병원 상세 2건/지역/매거진 목록·상세/사이트맵) 전부 200, 의사 관계·저자 fallback·지역 부모 체인 렌더 확인.
- P2 완료: 커밋 `5b7bed6` 배포(dpl_HYSaLcSZbmUWanfeXbifssTCehk6 = www.medirok.com 서빙 확인), 읽기 전용 스모크 e2e **57 passed / 0 failed** (4 skipped은 쓰기·조건부 스킵). 병원 상세 의사 렌더·매거진 저자 fallback·지역 체인 운영 확인.
- 남은 항목: 없음 (admin 확인은 7-1 참조).

## 7-1. P3 실행 기록 (2026-07-12)

- 사전 사고: P3 전 드리프트 상태에서 시드 스크립트의 dev push가 레거시 컬럼 DROP(= 리허설 없는 P3)을 시도 → `PAYLOAD_DB_PUSH` 가드 + `scripts/seed-payload.ts` 헬퍼로 차단 (커밋 `8ca7bea`). 운영 DB 부팅 스크립트는 모두 이 헬퍼를 경유해야 한다.
- p3-cleanup.sql에 Q2 변형 B 반영: `hospitals_texts`의 `doctors.%.credentials` 행 DELETE 활성화 (현행 `tags` path 보존).
- 사전 백업: `~/medirok-backups/prod-pre-p3-20260712-211112.sql` (pg_dump --no-owner --no-privileges, 운영 최신 상태).
- 리허설: `medirok-mig-rehearsal` 컨테이너를 위 덤프로 재구축 → 사전 검증(V1·V2·V3 = 0) → P3 실행(DELETE 15·79) → 스키마 검증(레거시 컬럼/테이블 0, NOT NULL 2, 데이터 보존: doctors 18·credentials 79·tags 16·keywords 55) → **push 켠 Payload 부팅으로 드리프트 0 확인** (코드 스키마 = P3 후 DB 스키마).
- 본 DB: 동일 실행(DELETE 15·79), 동일 검증 전부 통과. 라이브 스모크: 홈/병원 상세(한글 slug percent-encoding 필요)/매거진 목록·상세/사이트맵 전부 200.
- 베이스라인: `src/migrations/20260712_121529_init` 생성(테이블 22, 레거시 0) → 운영 `payload_migrations`에 batch 1로 마킹, dev push 마커(`dev`, batch -1) 제거. **이후 스키마 변경은 `payload migrate:create` → `payload migrate` 흐름으로만 관리** (로컬 dev·e2e는 push 유지).
- 리허설 컨테이너는 중지 상태로 보존(P3 후 상태). 불필요 시 `docker rm medirok-mig-rehearsal`.
- /admin 확인(P3 후, Chrome 자동화): 병원 목록 관계 컬럼(진료과·지역) 해석 ✓ · 디오디 상세 Department=피부과/Region=청담동 관계 필드 렌더 ✓ · 저장 검증(walkingMinutes 8→9→8 실변경 저장, FK 보존·updatedAt 갱신 — 값 미변경 시 Save는 no-op이므로 실변경으로 테스트) ✓ · Doctors 목록 hospital 관계 해석(디오디 5·예온 5+) ✓ · 매거진 목록 13건 렌더 ✓. 매거진 관계(연결 병원·진료과·지역·저자)는 세션 유실로 UI 대신 depth=1 API/SQL로 검증 완료 — **체크리스트 전 항목 종결**.

## 8. 리스크·롤백 매트릭스

| 시점 | 실패 시 조치 |
|---|---|
| P1 실행 중 | 트랜잭션 자동 롤백 — 재시도 (멱등 설계) |
| P1 후 ~ P2 전 | 아무 영향 없음 (구 코드는 새 컬럼 무시) |
| P2 배포 후 | 이전 배포로 롤백 (DB 트랜지셔널이라 안전) |
| P3 후 | 코드 롤백 불가 — Neon PITR/브랜치 복원만 가능. 반드시 P2 안정 확인 후 실행 |
