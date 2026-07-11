# medirok 리팩토링 플랜 (중복 제거·구조 개선)

작성일: 2026-07-04 · 범위: **동작 불변(behavior-preserving)** 리팩토링 · 검증: e2e 테스트 (75개, docs/e2e-test-plan.md)

> **실행 완료 (2026-07-04)**: Phase 1~5 완료, 전체 e2e 스위트 그린 (71 통과 / 4 fixme 스킵 / 0 실패).
> 조정 사항: ① 2.3 JSON-LD 조립 빌더는 Breadcrumbs 컴포넌트가 중복의 대부분(브레드크럼 조립 4곳)을 흡수해 별도 빌더 불필요 → 생략. ② 5.1 revalidate 상수화는 Next.js가 세그먼트 설정에 리터럴만 허용해 기술적으로 불가 → 생략. ③ 역 페이지는 브레드크럼에 링크 없는 항목(역주변·노선)이 있어 Breadcrumbs 미적용(기존 마크업 유지). ④ magazine/[slug]·category 페이지에 canonical 추가(테스트 선행 후), 매거진 findAll에 React cache 적용(hospitals-data와 일관).
> 신규 파일: lib/site.ts·format.ts·payload-mappers.ts, components/Breadcrumbs.tsx, hospital-finder 5분할(types·primitives·LocationModal·StationPicker·useHospitalFilters), hospital-detail 4섹션, region-dept 2컴포넌트. 삭제: lib/data.ts·magazines.ts (시드는 scripts/legacy-*로 보존).

## 0. 원칙과 검증 프로토콜

- 각 단계는 독립 커밋 단위로 진행하고, **단계 완료마다 관련 spec 실행 → Phase 완료마다 전체 스위트 실행**.
- e2e가 검증하는 계약(렌더 텍스트·URL·메타·canonical·JSON-LD 구조)이 리팩토링 안전망. 리팩토링으로 이 계약이 깨지면 테스트가 잡는다.
- 렌더 마크업을 바꾸는 작업(컴포넌트 추출)은 **텍스트·역할(role)·href를 그대로 유지**해야 e2e가 통과한다. 셀렉터가 의존하는 것: `nav` + "홈 ›", `dialog` role, 섹션 heading 텍스트, `.grid button`(진료과 모달), `section.sticky`(매거진 탭).

```bash
npm run typecheck                                  # 매 단계
npx playwright test <관련 spec> --project=chromium  # 매 단계
npm run test:e2e                                   # Phase 종료마다 (setup→chromium→mobile 전체)
```

**Phase 0 — 베이스라인**: 리팩토링 시작 전 `npm run test:e2e` 전체 그린 + `npm run typecheck` 통과를 기록해 둔다.

## 1. Phase 1 — 저위험 퀵윈 (상수·유틸 단일화)

| # | 작업 | 대상 | 검증 spec |
|---|---|---|---|
| 1.1 | **SITE_URL 단일화**: `lib/local-seo.ts`의 `SITE_URL`을 유일한 출처로. `sitemap.ts`의 중복 상수, `magazine/[slug]/page.tsx`의 하드코딩 `"https://medirok.com"` 문자열(브레드크럼·url 조립) 제거 | sitemap.ts, magazine/[slug], schema-generator.ts(logo URL) | seo, magazine, local-seo |
| 1.2 | **decodeParam 통합**: `hospitals/역/[line]/[station]/page.tsx`의 자체 `decode()` 제거 → `hospitals-data.decodeParam` 사용 | 역 station page | hospitals |
| 1.3 | **formatKRW 분리**: `lib/data.ts` → `lib/format.ts`로 이동, 5개 import 지점 수정. `data.ts`는 seed 데이터 전용이 되므로 `scripts/`로 이동(런타임 번들에서 제외) | data.ts, HospitalCard, QuickView, ListRow, local-seo, hospital/[slug] | hospitals, home |
| 1.4 | **Magazine 타입 이동**: `lib/magazines.ts`의 `Magazine`/`MagazineType` 타입 → `src/types/index.ts`로 통합, `seedMagazines`(400여 줄)는 `scripts/`로 이동. import 지점 4곳 수정 | magazines.ts, magazines-data.ts, AuthorProfile, MagazineCard, category page | magazine |

리스크: 낮음 (import 경로 변경 위주). Phase 종료 후 전체 스위트.

## 2. Phase 2 — 중복 마크업·스키마 컴포넌트화

| # | 작업 | 상세 | 검증 spec |
|---|---|---|---|
| 2.1 | **Breadcrumbs 컴포넌트**: 4곳(hospital/[slug], hospitals/[sido], [gu], [dept]) + 역 페이지에서 각자 조립하는 브레드크럼 nav 마크업 + `breadcrumbSchema()` JSON-LD를 `<Breadcrumbs items={[{name, href}]}>` 하나로 통합 — nav 렌더와 스키마 주입을 한 컴포넌트가 책임져 본문-스키마 불일치 원천 차단 | "홈 › ..." 텍스트 구조·링크 href 유지 필수 | local-seo(브레드크럼·BreadcrumbList 5단계), hospitals(상세 브레드크럼) |
| 2.2 | **FAQ 렌더 통일**: `[dept]/page.tsx`의 인라인 `<details>` FAQ(FaqBlock과 중복 마크업) → `FaqBlock` 재사용. 스타일 차이는 prop으로 흡수 | FAQPage JSON-LD 질문 수 == 본문 details 수 계약은 e2e가 검증 | local-seo(FAQPage 동기화 테스트) |
| 2.3 | **JSON-LD 조립 이동**: 페이지 본문의 `schemas: Record<string,unknown>[]` 조립 로직을 `lib/schema-generator.ts`의 조립 함수로 이동 (`buildHospitalDetailSchemas()`, `buildRegionDeptSchemas()`, `buildMagazineSchemas()`) — 페이지는 데이터만 전달 | 페이지 파일 슬림화 + 스키마 로직 단위 응집 | hospitals, local-seo, magazine의 JSON-LD 테스트 전부 |

리스크: 중간 (마크업 접점). e2e의 JSON-LD 파싱 검증(`expectJsonLdType`)이 핵심 안전망.

## 3. Phase 3 — 데이터 레이어 정리

| # | 작업 | 상세 | 검증 spec |
|---|---|---|---|
| 3.1 | **조회 함수 일원화**: `magazine/[slug]/page.tsx`가 `getAllMagazines()` 후 `.find()` 하는 패턴 → 기존 `getMagazineBySlug()` 사용. relatedMagazines/authorOtherArticles 파생 로직은 `magazines-data.ts`의 명명 함수로 이동 | 동작 동일, 페이지-데이터 결합 축소 | magazine 전체 |
| 3.2 | **hospital 상세 파생 조회 이동**: `getAllHospitals().filter(같은 진료과)` 등 페이지 내 필터링 → `getSimilarHospitals(deptSlug, excludeSlug)` 헬퍼로 | hospitals-data.ts에 위치 | hospitals(상세) |
| 3.3 | **매퍼 정리**: `hospitals-data.ts`의 `mapDoctor/mapPrice/mapReview/...` + str/num 유틸을 `lib/payload-mappers.ts`로 분리, `payload-types.ts` 생성 타입을 Raw 대신 입력 타입으로 사용해 드리프트 컴파일 타임 검출 | 수동 `Raw = Record<string, unknown>` 제거 | setup + hospitals + local-seo (데이터 형태 회귀) |
| 3.4 | **magazines.ts 정리**: 1.4 이후 남는 잔여물 제거, `magazines-data.ts`로 단일화 | — | magazine |

리스크: 중간 (데이터 매핑 변경). setup 프로젝트가 API 응답 형태를, 각 spec이 렌더 결과를 이중 검증.

## 4. Phase 4 — 대형 파일 분할

| # | 작업 | 상세 | 검증 spec |
|---|---|---|---|
| 4.1 | **HospitalFinder(834줄) 분할**: 파일 내 이미 함수로 분리된 `LocationModal`, `StationPicker` 등을 `hospital-finder/` 하위 개별 파일로 이동. 상태 로직(`results` useMemo, URL 동기화)은 `useHospitalFilters` 훅으로 추출 | "use client" 경계 유지, 렌더 결과 불변 | hospitals(필터·모달·정렬·퀵뷰·빈상태) + mobile(필터 UI) |
| 4.2 | **hospital/[slug]/page.tsx(442줄) 분할**: 진료/가격·의료진·후기·위치/진료시간 섹션을 `components/hospital-detail/` 서버 컴포넌트로 추출 | heading 텍스트 유지("진료 / 가격" 등 — e2e가 고정) | hospitals(상세 4개 테스트) |
| 4.3 | **[dept]/page.tsx(307줄) 정리**: 동 필터 칩, 인근지역/타진료과 내부링크 섹션 추출 | — | local-seo 전체 |

리스크: 중간~높음 (최다 라인 이동). 단계별로 잘게 커밋하고 매 커밋 관련 spec 실행.

## 5. Phase 5 — 일관성 마감

| # | 작업 | 상세 | 검증 |
|---|---|---|---|
| 5.1 | **revalidate 상수화**: 페이지마다 흩어진 `revalidate = 1800` / `force-dynamic` → `lib/cache.ts`의 명명 상수(`REVALIDATE_LISTING` 등)로. force-dynamic 필요 여부 페이지별 주석 근거화 | 동작 동일 | 전체 스위트 |
| 5.2 | **metadata 패턴 통일**: generateMetadata 조립을 `lib/metadata.ts` 헬퍼(`pageMeta({title, description, canonical, og})`)로 통일. ※ `magazine/[slug]`의 canonical 부재는 알려진 개선점 — 추가하는 순간 동작 변경이므로 **e2e `magazine.spec.ts` 메타 테스트에 `expectCanonical` 어서션을 먼저 추가**하고 함께 커밋 | 유일하게 계약이 바뀌는 항목 — 테스트 선행 | seo, magazine, local-seo, hospitals 메타 테스트 |

## 6. 범위 제외 (별도 플랜 대상)

버그 수정(booking 라우트, 역 페이지 404, 견적 폼 백엔드 — e2e에 fixme로 예약됨), 성능 최적화(쿼리·캐시 전략 변경), 하드코딩 콘텐츠 데이터화(홈 특가전, "312개" 카운트, `/event`·partner 링크), 대시보드 인증 강화(JWT·rate limit). 이들은 동작이 바뀌므로 이번 리팩토링과 섞지 않는다.

## 7. 실행 순서 요약

```
Phase 0  베이스라인 그린 확인
Phase 1  상수·유틸 단일화        → 관련 spec → 전체 스위트
Phase 2  Breadcrumbs·FAQ·JSON-LD → local-seo/hospitals/magazine → 전체
Phase 3  데이터 레이어           → setup+관련 spec → 전체
Phase 4  대형 파일 분할          → hospitals+mobile+local-seo → 전체
Phase 5  캐시·메타 일관성        → 전체 스위트 (+magazine canonical 테스트 선행 추가)
```

예상 효과: 페이지 파일 평균 40% 감축, SITE_URL/브레드크럼/FAQ 단일 출처화, 데이터 접근 계층 응집, 이후 기능 추가(예: booking 라우트) 시 접점 축소.
