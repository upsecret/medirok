# 지역 병원 리스트 페이지 — 로컬 SEO 강화 방안

대상: `/hospitals/[시도]/[구]/[진료과]` (예: `인천 / 서구 / 치과`)
검토일: 2026-06-20 · 라이브(www.medirok.com) + 코드 동시 진단

> **P0·P1 구현 완료 (2026-07 기준).** 아래 "1. 진단"은 2026-06-20 시점의 과거 스냅샷이며 현재와 다릅니다.
> - **P0(a) 시·도 풀네임**: `[dept]/page.tsx`가 `fullRegionName(sidoName, region.nameKr)`로 "인천 서구 치과" 생성 — 완료.
> - **P0(b) canonical / 동필터 noindex**: 완료 (e2e `local-seo.spec.ts`가 회귀 검증).
> - **P0(c) JSON-LD 주입**: 지역 리스트(BreadcrumbList·ItemList·FAQPage)·병원 상세(MedicalOrganization·AggregateRating·BreadcrumbList) 모두 주입 — 완료. 조립은 `schema-generator.ts` + `Breadcrumbs` 컴포넌트.
> - **P1(d)(e) 지역 인트로·동적 FAQ**: 구현됨(`region-dept/` 컴포넌트).
> - **미완/후속**: P2(g~j) 내부링크 확장·geo 좌표·`force-dynamic`→ISR·네이버 스마트플레이스는 진행 중/보류.
>
> 이 문서는 **P2 잔여 항목의 참고 자료**로만 유효합니다.

---

## 1. 진단 (2026-06-20 스냅샷 — 아래 값은 현재 해소됨)

`인천/서구/치과` 페이지를 라이브에서 실측한 결과:

| 항목 | 현재 값 | 문제 |
|---|---|---|
| `<title>` | **서구 치과** 메디록 인증 병원 | 시·도("인천") 누락 → 핵심 검색어 "인천 서구 치과"와 불일치 |
| `<h1>` | **서구 치과** | 동일 — 페이지 최상위 신호에 도시명 없음 |
| meta description | "**서구 치과** 메디록 4단계 인증 병원…" | 동일 — 지역 키워드 약함 |
| canonical | **없음(null)** | `?dong=` 등 파라미터 URL 중복 위험, 정식 URL 미지정 |
| JSON-LD 구조화 데이터 | **0개** | `schema-generator.ts`에 함수는 다 있으나 지역·병원 페이지엔 미적용 |
| 본문 콘텐츠 | 병원 1곳 + 정적 FAQ 2개 | 지역 소개 카피 없음, FAQ가 지역 무관 일반론 |
| 렌더링 | `force-dynamic` (전 페이지) | 캐싱 없음 → LCP·크롤 효율 불리 |

핵심 원인: 코드의 `generateMetadata`가 `region.nameKr`(= "서구", 구 이름만)을 쓰고 있어 상위 시·도가 빠짐. `src/app/(frontend)/hospitals/[sido]/[gu]/[dept]/page.tsx` 33~35행.

추가로, `schema-generator.ts`에는 `medicalOrgSchema` / `itemListSchema` / `breadcrumbSchema` / `faqPageSchema`가 모두 구현돼 있지만 **매거진 상세 페이지에서만** 사용되고, 지역 리스트·병원 상세 페이지에는 JSON-LD가 전혀 주입되지 않음.

---

## 2. 방안 (우선순위별)

### P0 — 즉효·소량 수정 (핵심)

**(a) 메타·H1에 시·도 풀네임 포함**
"서구 치과" → **"인천 서구 치과"**. 사용자 실제 검색어와 정렬.

```
title:       인천 서구 치과 추천 | 메디록 인증 병원 N곳 비교
description: 인천 서구 치과 메디록 4단계 인증 병원 N곳. 임플란트·교정·
             보철 가격과 실방문 후기, 야간·주말 진료를 한 번에 비교하세요.
h1:          인천 서구 치과
```
- 수정 위치: `[sido]/[gu]/[dept]/page.tsx`의 `generateMetadata`, `<h1>` (현재 `region.nameKr` → `${sidoName} ${region.nameKr}`)
- 병원 수(N)를 title/description에 넣어 CTR·정보성 강화
- 상위 페이지(`[sido]`, `[sido]/[gu]`)도 동일하게 시·도 포함 점검

**(b) canonical / alternates 추가**
`?dong=` 필터는 본문이 거의 동일 → 중복 콘텐츠. 정식 URL을 canonical로 고정.

```ts
alternates: { canonical: `/hospitals/${sido}/${gu}/${dept}` }
```
동(洞) 필터 페이지는 canonical을 부모(전체)로 지정하거나 `robots: noindex` 처리.

**(c) JSON-LD 주입 — 이미 만들어진 함수 재사용**
지역 리스트 페이지에:
- `breadcrumbSchema` — 홈 › 병원찾기 › 인천 › 서구 › 치과 (이미 화면엔 있으나 스키마化 안 됨)
- `itemListSchema` — 리스트의 병원들을 `ItemList`로 (생성형 검색·리치결과에 직접 반영)
- `faqPageSchema` — 하단 FAQ를 구조화 (AEO 직격)

병원 상세 페이지(`hospital/[slug]`)에:
- `medicalOrgSchema` — 이름·주소·전화·평점(`AggregateRating`)·진료과. 평점/후기 데이터가 이미 있어 즉시 적용 가능
- `breadcrumbSchema`

> 두 페이지 모두 `import { JsonLd }` 한 줄 + 스키마 호출만 추가하면 됨. 신규 개발 거의 없음.

### P1 — 콘텐츠 강화 (체류·AEO)

**(d) 지역 인트로 카피 (150~300자)**
H1 아래에 지역 맥락 단락 추가:
> "인천 서구(검단·청라 일대)에서 메디록이 4단계 검증한 치과를 모았습니다. 임플란트·교정·보철 가격과 실방문 후기, 야간·주말 진료 여부를 비교하세요."

지역명·진료과·시술 키워드를 자연스럽게 포함 → 얇은 페이지(thin content) 탈피.

**(e) FAQ를 지역·진료과 동적화**
현재 정적 2개(일반론) → 지역·진료과 변수로 생성:
- "인천 서구 치과 임플란트 평균 가격은?"
- "인천 서구에 야간·주말 진료 치과가 있나요?"
- "검단신도시에서 가까운 치과는?"

`faqPageSchema`와 연동하면 구글 FAQ 리치결과 + ChatGPT/Perplexity 등 생성형 답변 인용 확률↑ (GEO 핵심).

**(f) 빈약 페이지 처리**
병원 0~1곳인 조합은 (i) 인접 지역 병원 추천 노출 또는 (ii) `noindex`로 색인 품질 보호.

### P2 — 구조·내부링크·성능

**(g) 내부링크 확장**
- 같은 시·도 인접 구 교차링크 ("인천 다른 지역: 미추홀구 · 연수구 · 남동구 치과")
- 같은 구 다른 진료과 링크 ("서구 다른 진료과: 피부과 · 정형외과")
- 지하철역 페이지(`/hospitals/역/...`)와 상호 링크

**(h) geo 좌표 → LocalBusiness**
병원에 위·경도 필드 수집 시 `medicalOrgSchema`의 `geo` 활성화 → 지도/로컬팩 신호.

**(i) `force-dynamic` 재검토**
지역·병원 페이지는 변동 빈도가 낮음 → ISR(`revalidate`) 또는 정적+on-demand 재검증으로 전환해 LCP·크롤 예산 개선.

**(j) 네이버 대응 (한국 로컬 검색 필수)**
- 네이버 스마트플레이스 등록·정보 일치(NAP: 이름·주소·전화)
- 네이버 사이트 인증은 이미 적용됨(`layout.tsx`). 지역 키워드 본문 노출로 네이버 통합검색 대응.

---

## 3. 권장 실행 순서

1. **P0(a)(b)(c)** — 메타/H1 시·도 포함 + canonical + JSON-LD 주입. 코드 소량, 효과 즉각. 1차 배포.
2. **P1(d)(e)(f)** — 지역 인트로 + 동적 FAQ + 빈약 페이지 처리. AEO/GEO 본격 대응.
3. **P2** — 내부링크·geo·렌더링·네이버. 구조적 개선.

P0는 기존 `schema-generator.ts` 함수를 그대로 쓰므로 신규 로직이 거의 없습니다. 원하시면 P0 코드 수정부터 바로 적용하겠습니다.
