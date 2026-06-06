# 메디록 CMS 전략 — SEO/AEO 영업 도구로서의 매거진

> **핵심 인식**: 매거진은 브랜드 콘텐츠가 아니라 **고객 의원의 SEO/AEO 자산**.
> 모든 매거진 글 = 영업한 의원의 키워드 노출 + AEO 답변 데이터 축적 도구.

## 1. 전략 정렬

### 트로이 목마 흐름

```
영업 [SEO/AEO 솔루션]                      플랫폼 가치 상승
   │                                              │
   ▼                                              ▼
의원 큐레이션 등재 → 키워드 매거진 작성 → 의원 페이지에 리뷰 축적
   │                  │                 │
   │                  ▼                 ▼
   │           검색 1페이지 진입     LLM 답변 노출
   │                  │                 │
   └──────────────────┴─────────────────┘
                      │
                      ▼
              의원 KPI 개선 + 디렉터리 DB 자동 누적
```

### 매거진의 3중 역할

| 역할 | 대상 | 효과 |
|---|---|---|
| **SEO** | 검색 사용자 | 키워드 1페이지 노출 → 의원 페이지로 유입 |
| **AEO** | AI 검색 (ChatGPT·Perplexity·Google AI) | 짧은 답변 추출 → AI 추천 의원 노출 |
| **E-E-A-T** | Google 신뢰도 | 의사 저자·실제 사례·인증 데이터 → 도메인 권위 |

## 2. CMS 선택

### 후보 비교

| CMS | 장점 | 단점 | 점수 |
|---|---|---|:---:|
| **Payload CMS** ⭐ | TS 네이티브, Postgres, 자체호스팅, Next 친화 | 초기 셋업 학습 곡선 | ★★★★★ |
| Sanity | 클라우드, Studio UI 우수 | 한도 초과 시 유료, GROQ 학습 | ★★★★ |
| Strapi | 무료 오픈소스, 플러그인 풍부 | UI 다소 무거움, Node 의존 | ★★★ |
| Notion API | 친숙, 작성 쉬움 | 한국어 SEO 약함, 커스텀 제한 | ★★ |
| 자체 admin | 완전 제어 | 개발 비용 큼 | ★★ |

### 🏆 결정: **Payload CMS 3.x**

이유:
1. **Next.js 같은 서버에서 호스팅** — Payload 3는 Next.js 앱 내에 임베드 가능 → `/admin` 경로
2. **TypeScript 네이티브** — 메디록 코드와 동일 타입 시스템
3. **Postgres 사용** — 이미 정한 DB(Prisma용)와 동일
4. **자체호스팅 무료** — 모두닥처럼 자체 DB 보유 → 데이터 자산화
5. **영업팀 직접 사용 UI** — 작성·발행·미리보기 가능
6. **JSON-LD 자동 생성** — AEO 핵심
7. **Block-based editor** — 5종 템플릿 강력 지원

설치 (Phase 2 진입 시):
```bash
cd medirok
npx create-payload-app@latest
```

## 3. 매거진 템플릿 5종

### Template 01 — 시술 가이드 (SEO 메인)

**용도**: "임플란트 가격", "백내장 수술 비용" 같은 정보 검색 키워드 타겟

**필수 필드**:
- `seoTitle` — H1 (예: "65세 이상 임플란트, 보험 적용 가격과 의원 선택 기준")
- `metaDescription` (155자)
- `targetKeywords` (배열) — 1차/2차/롱테일
- `shortAnswer` (200자 이내) — **LLM 답변용** ★
- `body` (블록 에디터)
- `faqBlocks` (Q&A 배열) — FAQ schema 자동 생성
- `linkedHospitals` (큐레이션 의원 3-5개 자동 노출) ★
- `linkedTreatments`
- `linkedDepartment`
- `linkedRegions`
- `priceTable` (선택) — 가격 비교 표 → AI 인용 친화
- `medicalEntities` (Schema.org MedicalCondition·Procedure)

**자동 출력 schema**: `Article` + `FAQPage` + `MedicalEntity`

### Template 02 — Q&A 의사 답변 (AEO 핵심)

**용도**: "임플란트 후 음식 언제부터?" 같은 질문 검색 → LLM 답변 노출

**필수 필드**:
- `question` (H1)
- `shortAnswer` (1-2문장) ★ — LLM가 그대로 인용
- `detailedAnswer` (3-5문단)
- `expertDoctor` (큐레이션 의원 의사 1명) ★
- `relatedHospitals`
- `sources` (논문·가이드라인 출처)

**자동 출력 schema**: `QAPage` + `Person` (의사)

### Template 03 — 지역 가이드 (Local SEO)

**용도**: "강남 임플란트 의원 추천 TOP 10" 패턴

**필수 필드**:
- `targetRegion` (예: 강남구)
- `targetDepartment` (예: 치과)
- `targetTreatment` (예: 임플란트)
- `intro` (300자) — 지역+시술 개요
- `hospitalsRanked` (5-10개 의원 + 선정 이유) ★ — 큐레이션 의원 상위 노출
- `pricesAvg` (지역 평균 가격)
- `faqBlocks`

**자동 출력 schema**: `Article` + `ItemList` (의원 랭킹)

### Template 04 — 의원 인터뷰 (E-E-A-T + 자연 백링크)

**용도**: 큐레이션 의원 의사 인터뷰 → 의원 페이지로 자연 유입 + E-E-A-T 강화

**필수 필드**:
- `featuredHospital` (큐레이션 의원 1곳) ★
- `interviewedDoctor`
- `qaBlocks` (인터뷰 Q&A 5-10개)
- `caseStudies` (시술 사례 3-5개)
- `coverImage`

**자동 출력 schema**: `Article` + `Person` + `MedicalOrganization`

### Template 05 — 케이스 스토리 (전환 직격)

**용도**: "65세 어머니 임플란트 풀마우스 후기" — 실제 케이스 → 전환 강력

**필수 필드**:
- `patientAge`
- `patientCondition` (익명)
- `treatmentPath` (단계별 시술 과정)
- `beforeAfterImages` (전후 사진, 동의 필수)
- `featuredHospital`
- `featuredDoctor`
- `outcome` (결과 + 비용)
- `disclaimer` (의료법 광고심의 안전 문구 자동)

**자동 출력 schema**: `Article` + `MedicalAudience` + `MedicalGuideline`

## 4. AEO 자동화 시스템 (핵심 차별점)

### shortAnswer 필드 — LLM 답변 최적화

모든 매거진 글에 `shortAnswer` 필드 필수. 200자 이내, 답변 형식. LLM (ChatGPT·Perplexity·Claude·Google AI)이 이 필드를 그대로 추출하여 답변에 인용하도록 설계.

**예시**:
> 질문: "강남 임플란트 평균 가격은?"
> shortAnswer: "강남구 醫錄 인증 18개 치과 기준 임플란트 단일 평균 120~180만원입니다. 이벤트가는 35~49만원부터, 65세 이상 보험 적용 시 50%(약 60~90만원) 본인부담입니다. (메디록, 2026.06)"

### FAQ Schema 자동 주입

`faqBlocks` 필드에 Q&A 추가 → 페이지에 `<script type="application/ld+json">` FAQPage schema 자동 출력 → Google AI Overview, ChatGPT 검색 등에서 직접 노출.

### 모든 페이지에 schema 자동 추가

- Article schema (모든 매거진)
- Person schema (저자 의사)
- MedicalOrganization (큐레이션 의원)
- ItemList (랭킹 글)
- FAQPage (Q&A 글)
- Review aggregate (의원 페이지)

## 5. SEO 자동화 시스템

### 메타 자동 생성

```typescript
// 글 작성 시 자동 채워지는 필드
{
  title: `${seoTitle} | 메디록`,
  description: shortAnswer || generateFromBody(body, 155),
  openGraph: { ... },
  jsonLd: generateSchema(template, fields),
}
```

### 내부 링크 자동 추천

CMS에서 글 발행 → 같은 키워드/지역/시술의 다른 매거진/의원/Q&A 자동 추천 → "관련 글" 섹션 자동 생성. SEO 내부링크쥬스 증폭.

### sitemap.xml + RSS 자동

- `medirok.com/sitemap.xml` — 모든 매거진/의원/Q&A 자동 등록
- `medirok.com/rss.xml` — 신규 글 자동 피드
- 새 글 발행 시 IndexNow + Google ping 자동

## 6. 영업 워크플로우 자동화

### 신규 의원 큐레이션 등재 시

```
영업팀이 어드민에서 의원 등록
  ↓
시드 매거진 3편 자동 초안 생성:
  1. [시술 가이드] "{지역} {시술} 가격과 의원 선택 기준"
  2. [지역 가이드] "{지역} {진료과} 의원 추천 TOP {N}"
  3. [의원 인터뷰] "{의원명} {대표원장} 인터뷰"
  ↓
편집자 검토 + 의원 협조 받아 1주 내 발행
  ↓
키워드 모니터링 자동 시작
```

### 리뷰 수집 시스템 (로그인 X)

- 의원별 QR 코드 자동 생성 (`medirok.com/review/{hospital-slug}`)
- 환자가 QR 스캔 → 휴대폰 인증 → 영수증 사진 업로드 → 리뷰 작성
- 작성된 리뷰는 자동으로:
  - 의원 페이지에 표시
  - shortAnswer DB 자동 업데이트 ("실방문자 평점 ★4.9 / 312건")
  - AEO 답변 데이터로 활용

### 영업 성과 자동 리포트

매주 자동 생성 (의원별):
- 키워드 순위 변화 (구글/네이버)
- AI 검색 노출 (Perplexity·ChatGPT 검색 시뮬레이션)
- 매거진 트래픽
- 신규 리뷰 수
- 예약·견적 전환 건수

→ B2B 영업·갱신 자료로 활용

## 7. 로그인 제거 — 현 코드 정리

### 제거할 UI

| 위치 | 변경 |
|---|---|
| `Header.tsx` | "로그인" 링크 → **제거** |
| `MobileTabBar.tsx` | "마이" 탭 → **"매거진"으로 교체** |
| `Footer.tsx` | 변경 없음 (회원 메뉴 없음) |
| `lib/data.ts` 의 `User` | 사용 안함 (DB 진입 시 필요) |

### 인증이 필요한 곳 (휴대폰 인증만)

| 액션 | 인증 방식 |
|---|---|
| 무료 견적 신청 | 휴대폰 번호만 |
| 리뷰 작성 | 휴대폰 + 영수증 사진 |
| 예약 상담 | 휴대폰 번호만 |
| Admin / CMS | 메디록 직원 (별도 도메인 `admin.medirok.com`) |

→ **퍼블릭 사이트는 회원가입·로그인 일체 없음.** 모든 콘텐츠 누구나 읽기 가능 = SEO·AEO 최대화.

## 8. 구현 로드맵

### Phase 1 — CMS 기반 (4주)

- [ ] 현 MVP에서 로그인 UI 제거
- [ ] Payload CMS 3.x 셋업 (`/admin`)
- [ ] 매거진 템플릿 5종 컬렉션 정의
- [ ] AEO 필드 (shortAnswer, faqBlocks) 시스템
- [ ] JSON-LD schema 자동 생성기
- [ ] 첫 매거진 10편 작성 (강남 임플란트 시드)

### Phase 2 — 영업 워크플로우 (5~8주)

- [ ] 의원 신규 등재 시 시드 매거진 자동 초안
- [ ] 리뷰 수집 QR 시스템 (`/review/{slug}`)
- [ ] 키워드 순위 모니터링 (자체 또는 Ahrefs API)
- [ ] AI 검색 노출 모니터링
- [ ] 의원별 주간 리포트 자동 생성

### Phase 3 — 영업 어드민 (9~12주)

- [ ] 영업팀 어드민 대시보드 (`partner.medirok.com/admin`)
- [ ] 의원별 성과 리포트 PDF 자동 생성
- [ ] 갱신 알림 시스템
- [ ] B2B 영업 자료 자동 생성 (제안서)

### Phase 4 — 다국어 (13주~)

- [ ] 매거진 i18n 시스템
- [ ] 영문 / 일문 키워드 매핑
- [ ] 의료관광 (외국인) 매거진 라인

## 9. 의료법 준수 (중요)

매거진 모든 글에 자동 주입:
- 의료법 광고심의 안전 문구 (자동 disclaimer)
- "본 정보는 일반 의학 정보이며, 진단·처방을 대체하지 않습니다"
- 케이스 스토리는 의원 협조 동의서 필수
- 비교/순위 글은 객관 기준 명시 ("평점·진료건수·후기 기반")

→ 강남언니가 의료광고 심의로 여러 번 이슈 → 메디록은 **사전 차단 시스템** 내장

---

## 결론: 영업 도구로서의 매거진

매거진 = 메디록의 SEO/AEO 영업 자산.
한 편의 글이 한 의원의 키워드를 1페이지에 올리고, 한 줄의 shortAnswer가 ChatGPT 답변에 인용되며, 누적된 리뷰가 AI 추천 의원에 노출되는 시스템.

광고비를 받지 않으므로 신뢰가 자산이 되고, 그 신뢰로 영업한 의원의 매출이 오르며, 자연스럽게 디렉터리 데이터가 누적되어 플랫폼이 완성됨.

**이 모든 흐름의 출발점이 CMS 템플릿 설계.**
