# medirok slug 결합 제거 → 테이블 참조(FK) 전환 플랜

작성일: 2026-07-04 · 검증: 로컬 Postgres e2e (docs/e2e-local-db.md) · 선정 기준: **코딩 에이전트(Claude, Codex 등)가 쉽게 수정할 수 있는 방식 최우선**

> **구현 완료 (2026-07-04)**: M1~M6 전 단계 완료, 로컬 PG 전체 e2e 그린 (71 통과 / 4 fixme / 0 실패).
> - 스키마: doctors 컬렉션 신설(24명 승격 검증), hospitals.department/region(필수)·regions.parent·magazines 관계 4종. 레거시 slug 컬럼·임베드 doctors 전부 제거 확인.
> - Writer: `scripts/upsert-with-refs.ts` — 스크립트는 사람이 읽기 쉬운 slug 표기로 데이터를 정의하고 쓰기 직전에 관계로 변환(에이전트 친화 패턴). seed-e2e + 레거시 4개 스크립트 전환·로컬 실행 검증 완료.
> - Reader: payload-mappers가 FK 체인에서 flat slug를 파생 → 프론트엔드·e2e 계약 불변. M6: `getHospitalsByDeptAndRegion`을 관계 where(IN) 단일 쿼리로 전환.
> - `src/payload-types.ts` 재생성 완료.
>
> **운영(Neon) 적용**: `docs/prod-migration-runbook.md` 참조 — P1(추가+백필 SQL) → P2(신 코드 배포+스모크) →
> P3(NOT NULL·레거시 DROP) 3단계 무중단 런북. 실행 SQL은 `sql/prod-fk-migration/`에 준비됨 (Claude CLI로 실행).

## 1. 현황 — slug 기반 결합 지점 전수

| 참조하는 곳 | 필드 (현재 text/text[]) | 가리키는 곳 | 비고 |
|---|---|---|---|
| hospitals | departmentSlug | departments.slug | 진료과 |
| hospitals | sidoSlug / regionSlug / dongSlug | regions.slug ×3 | 지역 3계층을 평면 slug 3개로 |
| hospitals | nearestStationName | (정적 stations.ts) | DB 외부 — 이번 범위 제외 |
| hospitals.doctors[] | (array 필드 — 테이블 없음) | — | 의사가 독립 엔티티가 아님 |
| magazines | authorDoctorSlug | hospitals.doctors[].slug | **최대 취약점**: 테이블조차 없는 대상을 slug로 참조 |
| magazines | linkedHospitalSlugs (text[]) | hospitals.slug | N:M을 문자열 배열로 |
| magazines | linkedDepartmentSlug | departments.slug | |
| magazines | linkedRegionSlug | regions.slug | |
| regions | parentSlug | regions.slug | 자기참조 계층 |

문제: 참조 무결성 없음(오타·삭제 시 조용히 끊어짐), slug 변경 시 연쇄 수동 수정(migrate-korean-urls.ts가 그 증거), JOIN 불가로 앱 레이어에서 getAll 후 JS filter.

## 2. 방식 선정 — 에이전트 친화성 비교

| 기준 | A. Payload relationship 필드 (권장) | B. Raw SQL FK + 커스텀 쿼리 |
|---|---|---|
| 수정 지점 | 컬렉션 정의 파일 1곳 (선언적) | SQL 마이그레이션 + 쿼리 레이어 + admin 별도 |
| 스키마·FK·조인테이블 | Payload가 drizzle로 자동 생성 | 수동 관리 |
| 타입 | `payload:generate-types`로 자동 재생성 | 수동 동기화 |
| Admin UI | 관계 선택 UI 자동 제공 | 별도 구현 |
| 쿼리 | `where: { department: { equals: id } }` + `depth`로 populate | 자유롭지만 에이전트가 스키마 전체를 파악해야 함 |
| 탈출구 | `payload.db.drizzle`로 raw SQL 가능 | — |

**결론: A 채택.** 선언적 컬렉션 정의는 에이전트가 diff 한 번으로 이해·수정할 수 있고, 스키마·타입·admin이 자동 동기화된다. 성능이 필요한 지점만 `payload.db.drizzle`(이미 drizzle 스키마가 생성되어 있음)로 SQL 고도화한다 — 이것이 "SQL 고도화"의 실현 방식이다.

**역할 분리 원칙**: slug는 **URL 식별자**로만 유지(한국어 SEO URL 불변), 데이터 결합은 **관계(FK)**가 담당. URL·e2e 계약은 바뀌지 않으므로 기존 e2e 스위트가 그대로 안전망이 된다.

## 3. 목표 스키마

```
departments (기존 + 변경 없음, slug는 URL용)
regions     + parent: relationship → regions (self)     [parentSlug 대체]
doctors     ★신규 컬렉션 (hospitals.doctors 배열에서 승격)
            fields: slug(URL용), nameKr, title, ..., hospital: relationship → hospitals
hospitals   + department: relationship → departments    [departmentSlug 대체]
            + region: relationship → regions            [dong 또는 gu 최하위 하나만 참조,
                                                         sido/gu는 region.parent 체인으로 해석
                                                         → sidoSlug/regionSlug/dongSlug 3필드 대체]
magazines   + authorDoctor: relationship → doctors      [authorDoctorSlug 대체]
            + linkedHospitals: relationship(hasMany) → hospitals [linkedHospitalSlugs 대체]
            + linkedDepartment: relationship → departments
            + linkedRegion: relationship → regions
```

Payload가 생성하는 실제 Postgres 구조: 단수 관계는 `*_id` FK 컬럼, hasMany는 `magazines_rels` 관계 테이블 — 참조 무결성과 JOIN이 DB 레벨에서 보장된다.

## 4. 마이그레이션 단계 (모두 로컬 PG에서 개발, 단계마다 e2e 게이트)

| 단계 | 내용 | 검증 |
|---|---|---|
| M0 | 준비 완료: 로컬 PG e2e 환경(이번에 구축), 매퍼 단일화(payload-mappers.ts), 조회 함수 단일화(hospitals-data/magazines-data) — 리팩토링으로 reader 수정 지점이 이미 좁혀져 있음 | `npm run test:e2e:local` 그린 |
| M1 | **Additive**: doctors 컬렉션 신설 + 모든 relationship 필드 추가(기존 slug 필드 병존). `payload:generate-types` | 스키마 push 성공 + 전체 e2e 그린(동작 불변) |
| M2 | **Backfill**: `scripts/backfill-references.ts` — slug를 조회해 관계 ID 채움. 멱등(재실행 안전), 매칭 실패는 로그 후 skip. seed-e2e도 관계 포함해 갱신 | backfill 후 관계 NULL 0건 psql 확인 |
| M3 | **Reader 전환**: payload-mappers가 관계(populate된 doc 또는 ID)를 읽도록 수정, hospitals-data/magazines-data의 JS filter를 `where` 관계 쿼리로 교체 (예: `getHospitalsByDeptAndRegion` → `where: { department: ..., region: ... }`). 프론트 컴포넌트는 flat 타입 유지 → 변경 없음 | 전체 e2e 그린 — **이 단계가 계약 회귀 최대 위험 구간** |
| M4 | **Writer 전환**: 시드·업로드 스크립트(seed-yeon 등)가 관계로 쓰도록 갱신. admin에서 관계 편집 확인 | e2e + admin 수동 확인 |
| M5 | **정리**: departmentSlug/sidoSlug/regionSlug/dongSlug/authorDoctorSlug/linked*Slug(s) 필드 제거, 마이그레이션 생성. URL용 slug(unique)만 잔존 | 전체 e2e 그린 + typecheck |
| M6 | **SQL 고도화**: 병목 조회(지역×진료과 목록, sitemap 전체 스캔)를 관계 JOIN 단일 쿼리로. 기본은 Payload where/depth, 부족하면 `payload.db.drizzle` raw 쿼리를 `lib/queries/` 아래 격리 | e2e + 응답시간 비교 기록 |

프로덕션 적용: M1~M2는 additive라 무중단. M3~M5 배포 전 Neon 브랜치(무료 분기 기능)에서 backfill 리허설 → 본 적용. 각 단계는 독립 커밋/PR.

## 5. 에이전트 친화 원칙 (이 플랜이 지키는 것)

1. **선언 한 곳**: 관계는 컬렉션 정의 파일에만 선언 — 에이전트가 스키마를 코드에서 즉시 파악.
2. **자동 타입**: `payload:generate-types`가 유일한 타입 소스 — 수동 타입 드리프트 없음.
3. **단일 매퍼**: DB 형태 변화는 payload-mappers.ts 한 파일 수정으로 흡수 — 프론트 무접촉.
4. **멱등 스크립트**: 시드·backfill 전부 재실행 안전 — 에이전트가 부담 없이 재시도.
5. **e2e 게이트**: 모든 단계가 `npm run test:e2e:local` 그린을 통과 조건으로 — 회귀를 기계가 판정.
6. **raw SQL 격리**: 불가피한 SQL은 `lib/queries/`에만 — 탐색 비용 최소화.
