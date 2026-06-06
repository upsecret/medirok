# 메디록 (Medirok) MVP

> 시니어 의료 가이드 · `醫錄` (의록 = 의료의 기록)

Next.js 15 + React 19 + Tailwind v4 기반 MVP.

## 빠른 시작

```bash
# 프로젝트 폴더로 이동
cd "병원 디렉터리 사이트/medirok"

# 1. 환경변수 설정
cp .env.example .env
# → .env의 PAYLOAD_SECRET을 32자 이상 랜덤 문자열로 교체

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# → http://localhost:3000        (퍼블릭 사이트)
# → http://localhost:3000/admin  (Payload CMS — 첫 접속 시 관리자 계정 생성)
# → http://localhost:3000/magazine  (매거진 10편 시드)
```

빌드 / 프로덕션:
```bash
npm run build
npm run start
```

## 핵심 페이지

| URL | 페이지 |
|---|---|
| `/` | 홈 (큐레이션 + 디렉터리 이원) |
| `/hospitals` | 진료과 인덱스 |
| `/hospitals/dental` | 치과 진료과 |
| `/hospitals/dental/gangnam` | 강남 치과 (SEO 페이지) |
| `/hospital/hangyeol-dental` | 의원 상세 |
| `/magazine` | **매거진 리스트** |
| `/magazine/[slug]` | **매거진 상세** (AEO 최적화) |
| `/magazine/category/qna` | Q&A 카테고리 |
| `/estimate` | 무료 견적 (휴대폰만) |
| `/inje` | 醫錄 인증제 |
| `/admin` | **Payload CMS 어드민** |

## 폴더 구조

```
medirok/
├── prisma/
│   └── schema.prisma         # DB 스키마 (Phase 2부터 연결)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃 (Header/Footer/MobileTab)
│   │   ├── page.tsx          # 홈 (큐레이션 + 디렉터리 이원)
│   │   ├── globals.css       # 디자인 토큰 (Tailwind v4 @theme)
│   │   ├── hospitals/
│   │   │   ├── page.tsx                       # 진료과 인덱스
│   │   │   └── [dept]/
│   │   │       ├── page.tsx                   # 진료과별 의원 (예: /hospitals/dental)
│   │   │       └── [region]/page.tsx          # 진료과×지역 (예: /hospitals/dental/gangnam)
│   │   ├── hospital/
│   │   │   └── [slug]/page.tsx                # 의원 상세
│   │   ├── estimate/page.tsx                  # 무료 견적
│   │   └── inje/page.tsx                      # 醫錄 인증제 소개
│   ├── components/
│   │   ├── Logo.tsx                # 錄 Vault 로고
│   │   ├── Header.tsx              # 상단 헤더
│   │   ├── MobileTabBar.tsx        # 모바일 하단 탭바 (모두닥 패턴)
│   │   ├── Footer.tsx              # 푸터
│   │   ├── DepartmentGrid.tsx      # 진료과 그리드 (한자 아이콘)
│   │   ├── CurationCard.tsx        # TIER 1 — 醫錄 큐레이션 카드 (매거진 톤)
│   │   ├── HospitalCard.tsx        # TIER 2 — 일반 의원 디렉터리 카드
│   │   └── MedirokCertBox.tsx      # 醫錄 4단계 인증 박스
│   ├── lib/
│   │   └── data.ts                 # 샘플 데이터 (강남 임플란트 의원 시드)
│   └── types/
│       └── index.ts                # TypeScript 타입 정의
├── package.json
├── tsconfig.json
├── tailwind.config — Tailwind v4는 CSS 기반 (globals.css 내 @theme)
└── next.config.ts
```

## 디자인 시스템 핵심

| 영역 | 값 |
|---|---|
| Primary | Charcoal `#2D3748` |
| Accent | Soft Gold `#B89968` |
| Surface | Off White `#FAF8F3` |
| 한글 | Pretendard |
| 한자 | Noto Serif KR |
| 영문 헤드라인 | Cormorant Garamond |

## 이원 시스템 (핵심 차별점)

| TIER | 정의 | 디자인 | 비즈니스 |
|---|---|---|---|
| **01 醫錄 큐레이션** | 큐레이터 추가 심사 통과 | 골드 보더 1.5px + Serif + 인용문 | 유료 PREMIUM 파트너 |
| **02 디렉터리** | 醫錄 4단계 인증 의원 | 작은 카드 + Sans + 가격 명시 | 무료 등재 |

## 주요 페이지

- `/` — 홈 (큐레이션 hero + 진료과 + 디렉터리 + 매거진 + 통계)
- `/hospitals/dental` — 치과 진료과 (큐레이션 + 디렉터리)
- `/hospitals/dental/gangnam` — 강남 치과 (진료과×지역 SEO 페이지)
- `/hospital/hangyeol-dental` — 의원 상세 (醫錄 4단계 + 시술가 + 후기)
- `/estimate` — 백내장/임플란트 무료 견적
- `/inje` — 醫錄 인증제 소개

## 다음 단계 (Phase 2)

1. **Prisma DB 연결** (현재는 `lib/data.ts` 정적 데이터)
2. **Auth** — NextAuth + 휴대폰 인증 (시니어 친화)
3. **매거진 CMS** — `/magazine`, `/magazine/[slug]` (AEO 핵심)
4. **Q&A** — `/qna` (FAQ schema, AEO 직격)
5. **admin.medirok.com** — 의원 등록·인증 심사 관리자
6. **partner.medirok.com** — B2B 영업·대시보드
7. **i18n** — 영어 `/en`, 일본어 `/jp` 확장 베이스
8. **SEO** — sitemap.xml, robots.txt, JSON-LD schema 자동생성

## 개발 가이드

### Tailwind v4 (CSS 기반 config)

`src/app/globals.css`의 `@theme` 블록에서 모든 컬러/폰트 토큰을 정의합니다.
컴포넌트에서 사용 시:

```tsx
<div className="bg-[var(--color-primary-600)] text-[var(--color-accent-400)]">
  ...
</div>
```

### 한자 표기 (브랜드 자산)

```tsx
<span className="hanja">醫錄</span>
```

`.hanja` 클래스로 Noto Serif KR 폰트 적용.

### 새 의원 추가

`src/lib/data.ts`의 `hospitals` 배열에 객체 추가. 타입은 `src/types/index.ts` 참조.

## 배포 (Cloudflare Pages 권장)

```bash
npx wrangler pages deploy .next/static
```

또는 Vercel:
```bash
vercel --prod
```

## 라이선스

(주) 메디록 · 2026 · All rights reserved.
