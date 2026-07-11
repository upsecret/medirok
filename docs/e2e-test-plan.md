# medirok E2E 테스트 구현 플랜

작성일: 2026-07-04 · 기준: Playwright(Chromium, ko-KR, baseURL localhost:3000), 기존 8개 스펙 / 25개 테스트

> **구현 완료 (2026-07-04)**: 전체 75개 테스트(setup 1 + chromium 67 + mobile 7) 구현·실행 완료.
> 71개 통과, 4개 `test.fixme` 예약: ① 견적 폼 제출×2(백엔드 미구현) ② `/hospital/[slug]/booking` 라우트 부재(홈 큐레이션 CTA 404) ③ `/hospitals/역/...` 역 페이지 404(정적 한글 세그먼트 라우팅 — 원인 확인 필요, sitemap에 포함되므로 우선 수정 권장).
> D2~D4(지역 SEO P0)는 이미 구현되어 있어 fixme가 아닌 실제 회귀 테스트로 작성됨.

## 1. 현황 요약

기존 e2e/ 커버리지:

| 스펙 | 커버 범위 |
|---|---|
| home.spec.ts | 히어로·핵심 섹션, 매거진 CTA, 지역 더보기 링크 |
| hospitals.spec.ts | 필터 칩바·카운터, 지역 모달, 정렬 URL 반영, 퀵뷰→상세, 상세 JSON-LD, 강남구 치과 지역 페이지 |
| magazine.spec.ts | 목록 히어로·카테고리 탭, 탭 필터 이동, 상세 렌더, 카드→상세 |
| navigation.spec.ts | 데스크톱 헤더, 로고, 모바일 탭바 |
| dashboard.spec.ts | 미인증 리다이렉트, 잘못된 비밀번호, 정상 로그인 |
| seo.spec.ts | robots.txt, sitemap.xml, 대시보드 noindex |
| static-pages.spec.ts | 인증제 소개, 견적 폼 필드 표시 |

주요 갭: 진료과/역 필터 미검증, 지역 SEO 타이틀·canonical·JSON-LD 스키마 구조 미검증(local-seo-개선방안.md의 P0 항목), 매거진 마크다운/AEO 블록 미검증, 폼 제출 없음, 404 시나리오 없음, 모바일은 탭바만 검증.

플레이키 리스크: DB 데이터 유무에 따른 skip, 정규식 텍스트 파싱(`醫錄 인증 병원 N곳`), 텍스트 셀렉터 의존(data-testid 전무), 퀵뷰 경유 slug 탐색.

## 2. 요구사항 → 테스트 매핑

표기: ✅ 기존 커버 · 🔶 부분 커버(보강) · ❌ 신규

### A. 홈 (`/`) — home.spec.ts 보강

| # | 요구사항 (출처) | 테스트 | 상태 |
|---|---|---|---|
| A1 | 히어로 + 핵심 섹션 노출 (README) | 기존 유지 | ✅ |
| A2 | 큐레이션 3종 카드 렌더 (README, CurationCard) | 카드 개수·링크 href 검증 | ❌ |
| A3 | 진료과 디렉터리 5종 → /hospitals 필터 경로 연결 (Departments) | 각 아이콘 클릭 시 URL 검증 | ❌ |
| A4 | 매거진 최신 3건 섹션 → 상세 링크 (MagazineCard) | 카드 존재 + href `/magazine/` 검증 | 🔶 |
| A5 | 지역 퀵내비 → `/hospitals/[sido]/[gu]` SEO 경로 (RegionQuickNav) | 기존 유지 + 대표 지역 2~3개 링크 검증 | 🔶 |

### B. 병원찾기 (`/hospitals`) — hospitals.spec.ts 보강

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| B1 | 필터 칩바 + `醫錄 인증 병원 N곳` 카운터 | 기존 유지 | ✅ |
| B2 | 지역 선택 모달 열기/닫기/선택 시 URL·결과 반영 | 선택 후 카운터 변화·URL 파라미터까지 확장 | 🔶 |
| B3 | 진료과 필터 적용 시 결과·URL 반영 | 신규 | ❌ |
| B4 | 역 필터 → `/hospitals/역/[line]/[station]` 렌더 | 신규 (대표 역 1개) | ❌ |
| B5 | 정렬 변경 시 sort 파라미터 + 첫 항목 순서 변화 | 순서 검증 추가 | 🔶 |
| B6 | 퀵뷰 → 상세 이동 | 기존 유지 | ✅ |
| B7 | 결과 0건 시 빈 상태 UI | 존재하지 않는 필터 조합으로 검증 | ❌ |

### C. 병원 상세 (`/hospital/[slug]`)

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| C1 | 200 응답 + JSON-LD 존재 | 기존 유지 | ✅ |
| C2 | 4단계 인증 박스(MedirokCertBox) 렌더 | 신규 | ❌ |
| C3 | 가격표(PriceTable) 렌더 | 신규 | ❌ |
| C4 | 후기·의료진 섹션 렌더 (디오디-리뷰적용 가이드) | 신규 | ❌ |
| C5 | JSON-LD가 유효한 JSON + `@type` MedicalClinic류 검증 | 파싱 검증 추가 | 🔶 |
| C6 | 존재하지 않는 slug → 404 | 신규 | ❌ |

### D. 지역 SEO 페이지 (`/hospitals/[sido]`, `/[gu]`, `/[dept]`) — local-seo-개선방안.md P0 핵심

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| D1 | 3단계 경로 모두 200 렌더 | 강남구만 → sido/gu/dept 각 1개씩 확장 | 🔶 |
| D2 | 타이틀에 상위 지역 포함 (예: "인천 서구 치과", "서구 치과" 아님) | title 정규식 검증 — **P0 버그 회귀 테스트** | ❌ |
| D3 | canonical 링크 존재, 필터 URL은 noindex | `link[rel=canonical]`·robots meta 검증 | ❌ |
| D4 | JSON-LD BreadcrumbList·ItemList·FAQ 주입 (schema-generator.ts) | script[type=application/ld+json] 파싱·@type 검증 | ❌ |
| D5 | 지역 페이지 간 내부 링크(인근 지역·진료과) | 링크 존재 검증 | ❌ |

※ D2~D4는 현재 미구현 P0 항목 → 구현 전까지 `test.fixme()`로 작성해 스펙을 먼저 고정.

### E. 매거진 (`/magazine`) — magazine.spec.ts 보강

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| E1 | 목록 히어로·카테고리 탭·탭 필터 | 기존 유지 | ✅ |
| E2 | 카테고리 페이지(`/category/[cat]`)에 해당 카테고리 글만 노출 | 신규 | ❌ |
| E3 | 상세: 마크다운 렌더(제목·표·리스트, remark-gfm) (매거진-마크다운-렌더링-개선플랜) | h2/table/ul 렌더 검증 | ❌ |
| E4 | AEO: ShortAnswerBlock + FaqBlock 렌더 & FAQ JSON-LD | 신규 — **AEO 핵심** | ❌ |
| E5 | AuthorProfile·MedicalDisclaimer 표시 | 신규 | ❌ |
| E6 | 상세 meta: title·description·OG 태그 | 신규 | ❌ |
| E7 | 존재하지 않는 slug → 404 | 신규 | ❌ |

### F. 무료 견적 (`/estimate`)

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| F1 | 폼 필드 표시 | 기존 유지 | ✅ |
| F2 | 필수값 없이 제출 시 브라우저 검증 동작 | required 속성 검증 | ❌ |
| F3 | 제출 성공 플로우 | 백엔드 미구현 → `test.fixme()` 예약 | ❌ |

### G. 인증제 (`/verification`) — 기존 유지 ✅

### H. 대시보드 (`/dashboard`, middleware.ts)

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| H1 | 미인증 → `/dashboard/login?next=` 리다이렉트 | `next` 파라미터 보존 검증 추가 | 🔶 |
| H2 | 잘못된 비밀번호 오류 / 정상 로그인 | 기존 유지 | ✅ |
| H3 | 로그인 후 원래 경로(`next`)로 복귀 | 신규 | ❌ |
| H4 | 로그아웃 후 재접근 차단 | 신규 (로그아웃 UI 있으면) | ❌ |

### I. 전역 SEO — seo.spec.ts 보강

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| I1 | robots.txt·sitemap.xml 응답 | 기존 유지 | ✅ |
| I2 | sitemap에 병원 상세·매거진·지역 페이지 URL 포함 | XML 내용 검증 | ❌ |
| I3 | 주요 페이지 title·description·OG 태그 (홈/목록/상세) | 신규 | ❌ |
| I4 | `/admin`·`/dashboard` sitemap 미포함 & noindex | noindex 기존 + sitemap 제외 추가 | 🔶 |

### J. 반응형/모바일 — mobile-rollout-plan.md

| # | 요구사항 | 테스트 | 상태 |
|---|---|---|---|
| J1 | 모바일 탭바 내비게이션 | 기존 유지 | ✅ |
| J2 | 모바일 뷰포트에서 홈·병원찾기·매거진 핵심 UI 렌더(가로 스크롤 없음) | 신규 (mobile project) | ❌ |
| J3 | 병원찾기 필터 UI 모바일 동작 | 신규 | ❌ |

## 3. 테스트 인프라 개선 (선행 작업)

1. **시드 데이터 고정**: `test.skip(데이터 없음)` 패턴 제거. `playwright.config.ts`의 `webServer`에 시드 확인 스텝 추가하거나, `globalSetup`에서 Payload REST(`/api/hospitals?limit=1`)로 데이터 확인 후 없으면 `payload:seed` 실행. slug 탐색은 UI 경유 대신 REST API로 전환(helpers.ts 개선) → 속도·안정성 확보.
2. **data-testid 도입**: 파싱 취약 지점만 최소 적용 — 병원 카운터, 퀵뷰 상세 링크, 필터 칩, AEO 블록. 텍스트 셀렉터는 유지하되 정규식 파싱 제거.
3. **projects 분리**: `desktop-chromium` + `mobile-chromium`(Pixel 7 등). 모바일 전용 스펙은 `*.mobile.spec.ts` 네이밍 또는 `test.use({ viewport })`.
4. **공통 헬퍼 추가**: `expectJsonLd(page, type)` (파싱+@type 검증), `expectMeta(page, {title, canonical, robots})`, `apiFirstSlug(request, collection)`.

## 4. 구현 순서

| 단계 | 내용 | 신규/수정 파일 |
|---|---|---|
| 0 | 인프라: 시드 globalSetup, helpers API화, JSON-LD/meta 헬퍼, mobile project | playwright.config.ts, e2e/helpers.ts, e2e/global-setup.ts |
| 1 | 지역 SEO(D1~D5) — P0 회귀 테스트 우선 | e2e/local-seo.spec.ts (신규) |
| 2 | 병원 상세 보강(C2~C6) + 병원찾기 필터(B3, B4, B7) | e2e/hospitals.spec.ts |
| 3 | 매거진 마크다운·AEO(E2~E7) | e2e/magazine.spec.ts |
| 4 | 전역 SEO 보강(I2~I4) + 홈 보강(A2~A3) | e2e/seo.spec.ts, e2e/home.spec.ts |
| 5 | 대시보드(H1, H3~H4) + 견적(F2~F3) | e2e/dashboard.spec.ts, e2e/static-pages.spec.ts |
| 6 | 모바일(J2~J3) | e2e/mobile.spec.ts (신규) |

각 단계 완료 시 `npm run test:e2e`로 전체 그린 확인 후 다음 단계 진행. 미구현 기능(D2~D4, F3)은 `test.fixme()`로 스펙만 고정해 두고 기능 구현 시 활성화.

## 5. 예상 결과

기존 25개 → 약 55~60개 테스트. 신규 스펙 2개(local-seo, mobile), 기존 6개 스펙 보강, skip 의존 제거로 CI 안정성 확보.
