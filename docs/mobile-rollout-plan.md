# 메디록 모바일 앱 로드맵 (Phase 1~3)

> 현재는 웹(medirok.com)만 운영. 모바일 앱은 추후 진행.
> 진행 시 PWA 단계는 건너뛰고 곧바로 React Native 풀스택 진행.

## 결정 사항 (확정)

- **방식**: React Native + Expo (네이티브, 단일 코드베이스로 iOS/Android)
- **PWA**: 별도 단계로 진행하지 않음
- **백엔드**: 현재 웹의 Payload CMS 그대로 공유 (REST/GraphQL API)
- **디자인**: Charcoal + Gold 토큰 동일 — NativeWind v5로 Tailwind 그대로 사용
- **배포**: Expo EAS Build → App Store + Play Store

## 핵심 기술 결정

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Expo SDK 53+** | RN 0.81+, 풀매니지드, EAS 통합 |
| 라우팅 | **Expo Router 4** | Next.js App Router와 동일 file-based 패턴 |
| 스타일링 | **NativeWind v5** | Tailwind 클래스 그대로 RN에서 사용 → 디자인 시스템 단일화 |
| 상태/데이터 | **TanStack Query v5** | Payload API 호출·캐시·SSR 동일 패턴 |
| 푸시 | **Expo Notifications + FCM/APNs** | 단일 SDK로 양 플랫폼 |
| 카메라 | **expo-camera** | 영수증 인증·리뷰 사진 |
| 위치 | **expo-location** | 인근 의원 자동 검색 |
| 알림톡 | **Kakao SDK + 알림톡 사업자 채널** | 시니어 친화 알림 채널 |
| 로컬DB | **MMKV** | 빠른 KV 캐시 (관심의원·최근 본 글) |

---

# Phase 1 — 모노레포 전환 (2주)

목표: 현재 단일 Next.js 프로젝트를 모노레포로 재편하여 모바일 앱 추가의 토대를 만든다.

## 결과 폴더 구조

```
medirok-platform/                          ← 모노레포 root
├── apps/
│   ├── web/                               ← 현재 medirok/ 폴더 이동
│   │   ├── src/app/
│   │   ├── src/payload/
│   │   ├── payload.config.ts
│   │   └── package.json
│   └── (mobile/)                          ← Phase 2에서 추가
├── packages/
│   ├── types/                             ← 공통 TypeScript 타입
│   │   ├── src/
│   │   │   ├── hospital.ts
│   │   │   ├── magazine.ts
│   │   │   ├── doctor.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── design-tokens/                     ← 디자인 토큰 (NativeWind 호환)
│   │   ├── src/
│   │   │   ├── colors.ts                  (Charcoal+Gold)
│   │   │   ├── typography.ts
│   │   │   ├── spacing.ts
│   │   │   └── tailwind-preset.ts         ← 공통 Tailwind preset
│   │   └── package.json
│   ├── api-client/                        ← Payload REST SDK
│   │   ├── src/
│   │   │   ├── client.ts                  (fetch wrapper)
│   │   │   ├── hospitals.ts               (의원 조회)
│   │   │   ├── magazines.ts               (매거진 조회)
│   │   │   ├── reviews.ts                 (리뷰 작성)
│   │   │   ├── estimates.ts               (견적 신청)
│   │   │   └── react-query/               (TanStack Query hooks)
│   │   │       ├── use-hospitals.ts
│   │   │       └── use-magazines.ts
│   │   └── package.json
│   └── config/                            ← 공유 설정 (선택)
│       ├── tsconfig/
│       └── eslint/
├── turbo.json
├── package.json                            (workspace root)
├── pnpm-workspace.yaml                     (pnpm 권장)
└── README.md
```

## 작업 단계

### 1주차: 모노레포 셋업 + 자산 이전

| 일차 | 작업 |
|---|---|
| 1 | Turborepo + pnpm workspace 초기 설정 |
| 2 | 현재 `medirok/` → `apps/web/` 이동, 빌드 확인 |
| 3 | `packages/types` 추출 (현 `src/types/index.ts`) |
| 4 | `packages/design-tokens` 추출 (현 `globals.css` `@theme`) |
| 5 | `web` 앱이 `packages/*` 사용하도록 import 변경 + 회귀 테스트 |

### 2주차: API 클라이언트 + 마이그레이션

| 일차 | 작업 |
|---|---|
| 6-7 | `packages/api-client` 작성 — Payload REST 호출 함수 |
| 8 | TanStack Query 도입 — hooks 작성 (`useHospitals`, `useMagazine`) |
| 9 | 현 `lib/data.ts` 정적 데이터 → Payload DB 시드 스크립트 |
| 10 | 웹 페이지를 정적 데이터 → API 호출로 점진 마이그레이션 |

## 핵심 파일 예시

### `packages/design-tokens/src/colors.ts`

```typescript
export const colors = {
  primary: {
    50: "#F7F8FA", 100: "#EDF0F5", 200: "#D7DCE3", 300: "#B0B7C3",
    400: "#8492A6", 500: "#4A5568", 600: "#2D3748", 700: "#1F2937",
    800: "#141A23", 900: "#0B0F15",
  },
  accent: {
    50: "#FAF6ED", 100: "#F3EAD0", 200: "#E8D4A8", 300: "#D6B783",
    400: "#B89968", 500: "#9A7E4F", 600: "#7C6238", 700: "#5C4828",
    800: "#3D2F1A", 900: "#1F180D",
  },
  surface: {
    bg: "#FAF8F3", bg2: "#F4F1E8", card: "#FFFFFF",
    border: "#E8E2D4", divider: "#F0EAD8",
  },
  text: {
    primary: "#1F2937", secondary: "#4A5568",
    muted: "#6B5F45", inverse: "#FAF8F3", onGold: "#2D2412",
  },
  semantic: {
    success: "#2E7D5C", warning: "#C4892D",
    danger: "#B4453E", info: "#4A6FA0",
  },
} as const;
```

### `packages/design-tokens/src/tailwind-preset.ts`

```typescript
import { colors } from "./colors";

export const medirokPreset = {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ["Pretendard"],
        serif: ["Cormorant Garamond", "Noto Serif KR"],
        hanja: ["Noto Serif KR"],
      },
    },
  },
};
```

→ 웹·모바일 양쪽 `tailwind.config`에서 이 preset 사용.

### `packages/api-client/src/hospitals.ts`

```typescript
import { client } from "./client";
import type { Hospital, Department, Region } from "@medirok/types";

export async function getHospitals(params?: {
  departmentSlug?: string;
  regionSlug?: string;
  tier?: "PREMIUM" | "STANDARD";
  limit?: number;
}) {
  const where = {
    ...(params?.departmentSlug && { "department.slug": { equals: params.departmentSlug } }),
    ...(params?.regionSlug && { "region.slug": { equals: params.regionSlug } }),
    ...(params?.tier && { tier: { equals: params.tier } }),
  };
  return client.find<Hospital>("hospitals", { where, limit: params?.limit ?? 20 });
}

export async function getHospitalBySlug(slug: string) {
  const result = await client.find<Hospital>("hospitals", {
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return result.docs[0] ?? null;
}
```

### `packages/api-client/src/react-query/use-hospitals.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { getHospitals, getHospitalBySlug } from "../hospitals";

export function useHospitals(params?: Parameters<typeof getHospitals>[0]) {
  return useQuery({
    queryKey: ["hospitals", params],
    queryFn: () => getHospitals(params),
  });
}

export function useHospital(slug: string) {
  return useQuery({
    queryKey: ["hospital", slug],
    queryFn: () => getHospitalBySlug(slug),
    enabled: !!slug,
  });
}
```

## Phase 1 완료 기준

- [ ] `npm run dev` (web) 정상 작동
- [ ] 디자인 토큰이 `packages/design-tokens`에서 단일 정의
- [ ] 의원/매거진 데이터 모두 Payload API로 조회
- [ ] 타입이 `@medirok/types`에서 단일 정의
- [ ] 빌드 시간 < 60초 (Turbo 캐시)

---

# Phase 2 — Expo 모바일 앱 (8주)

목표: iOS + Android 동시 작동하는 메디록 앱 출시 준비. 5개 핵심 화면 + 푸시·카메라·위치 기능.

## 디렉터리

```
apps/mobile/
├── app/                                   ← Expo Router
│   ├── (tabs)/
│   │   ├── _layout.tsx                    (하단 탭바)
│   │   ├── index.tsx                      (홈)
│   │   ├── hospitals.tsx                  (의원찾기)
│   │   ├── magazine.tsx                   (매거진)
│   │   ├── estimate.tsx                   (무료견적)
│   │   └── settings.tsx                   (설정)
│   ├── hospital/[slug].tsx                (의원 상세)
│   ├── magazine/[slug].tsx                (매거진 상세)
│   ├── doctor/[slug].tsx                  (의사 프로필)
│   ├── review/new/[hospitalSlug].tsx      (리뷰 작성 + 카메라)
│   ├── booking/[hospitalSlug].tsx         (예약)
│   └── _layout.tsx                        (루트 레이아웃)
├── components/
│   ├── Logo.tsx                           (RN 버전)
│   ├── HospitalCard.tsx                   (RN 버전)
│   ├── CurationCard.tsx
│   ├── MagazineCard.tsx
│   ├── ShortAnswerBlock.tsx
│   ├── FaqBlock.tsx
│   ├── MedicalDisclaimer.tsx
│   └── ui/                                (Button, Input, Badge 등)
├── lib/
│   ├── notifications.ts                   (Expo Notifications)
│   ├── kakao.ts                           (Kakao SDK)
│   └── analytics.ts
├── app.config.ts                          (Expo 설정)
├── eas.json                               (EAS Build 설정)
├── tailwind.config.js                     (NativeWind + design-tokens preset)
├── babel.config.js
└── package.json
```

## 작업 단계

### 1-2주차: 셋업 + 디자인 시스템 적용

| 작업 | 상세 |
|---|---|
| Expo 프로젝트 생성 | `npx create-expo-app@latest apps/mobile --template tabs` |
| NativeWind 설치 + 설정 | `packages/design-tokens` preset 사용 |
| 폰트 로드 | Pretendard, Noto Serif KR, Cormorant Garamond |
| 공통 UI 컴포넌트 | Button, Input, Badge, Card 등 (Tailwind 클래스 그대로) |
| 로고 컴포넌트 (錄 Vault) | RN SVG로 |

### 3-4주차: 5개 메인 화면

| 화면 | 작업 |
|---|---|
| 홈 | 醫錄 큐레이션 hero + 진료과 + 디렉터리 + 매거진 |
| 의원찾기 | 진료과 필터 + 의원 리스트 + 검색 |
| 매거진 | 카테고리 탭 + 글 리스트 |
| 무료견적 | 폼 + 휴대폰 인증 + 알림톡 전송 |
| 설정 | 알림 설정·약관·버전 |

### 5-6주차: 상세 화면 + 인터랙션

| 화면 | 작업 |
|---|---|
| 의원 상세 | 사진 갤러리·醫錄 4단계·시술가격·후기·예약/견적 CTA |
| 의원 상세 — 전화 | `Linking.openURL('tel:...')` (시니어 직격 1탭) |
| 의원 상세 — 길찾기 | 카카오맵 / 네이버지도 딥링크 |
| 매거진 상세 | shortAnswer 박스 + body + FAQ + 의원 카드 |
| 리뷰 작성 | expo-camera 영수증 촬영 + 휴대폰 인증 |
| 예약 | 폼 + 휴대폰 인증 → Payload `bookings` 컬렉션 저장 |

### 7주차: 네이티브 기능

| 기능 | 작업 |
|---|---|
| 푸시 알림 | Expo Notifications + APNs(iOS)/FCM(Android) 셋업, Payload webhook → 푸시 전송 |
| 위치 권한 | 인근 의원 자동 검색 (옵션) |
| 카카오 알림톡 | 사업자 채널 신청 → 견적/예약 확인 알림톡 |
| 로컬 캐시 | MMKV로 최근 본 의원/관심 의원 저장 (로그인 없이) |
| 딥링크 | medirok.com/hospital/X → 앱 |

### 8주차: 시니어 UX 마무리

| 작업 | 상세 |
|---|---|
| 폰트 크기 조절 | 시스템 폰트 크기 따르기 + 추가 "크게" 옵션 |
| 다크모드 | 일단 라이트만 지원 (시니어 선호) |
| 접근성 | VoiceOver/TalkBack 라벨 전체 추가 |
| 에러 상태 | 네트워크 오류 시 명확한 메시지 + 재시도 버튼 |
| 로딩 상태 | 시니어 친화 (큰 로딩 표시) |

## 핵심 코드 예시

### `apps/mobile/app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from "expo-router";
import { Home, Search, BookOpen, FileText, Settings } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2D3748",
        tabBarInactiveTintColor: "#6B5F45",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#E8E2D4" },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "홈", tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="hospitals" options={{ title: "의원찾기", tabBarIcon: ({ color }) => <Search color={color} size={22} /> }} />
      <Tabs.Screen name="magazine" options={{ title: "매거진", tabBarIcon: ({ color }) => <BookOpen color={color} size={22} /> }} />
      <Tabs.Screen name="estimate" options={{ title: "무료견적", tabBarIcon: ({ color }) => <FileText color={color} size={22} /> }} />
      <Tabs.Screen name="settings" options={{ title: "설정", tabBarIcon: ({ color }) => <Settings color={color} size={22} /> }} />
    </Tabs>
  );
}
```

### `apps/mobile/components/HospitalCard.tsx` (NativeWind)

```tsx
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import type { Hospital } from "@medirok/types";

interface Props { hospital: Hospital; }

export function HospitalCard({ hospital }: Props) {
  const isPremium = hospital.tier === "PREMIUM";
  return (
    <Link href={`/hospital/${hospital.slug}`} asChild>
      <Pressable
        className={`bg-surface-bg p-3 rounded-md ${
          isPremium ? "border-[1.5px] border-accent-400" : "border-[0.5px] border-surface-border"
        }`}
      >
        <View className="flex-row gap-3">
          <View className="w-16 h-16 bg-primary-600 rounded-md items-center justify-center">
            <Text className="text-accent-400 text-2xl" style={{ fontFamily: "Noto Serif KR" }}>
              {hospital.department.hanja}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-medium text-base">{hospital.nameKr}</Text>
            <Text className="text-text-muted text-xs mt-1">
              ★ {hospital.rating} ({hospital.reviewCount})
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
```

### `apps/mobile/lib/notifications.ts`

```tsx
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
```

## Phase 2 완료 기준

- [ ] iOS Simulator·Android Emulator에서 정상 작동
- [ ] 5개 메인 화면 + 4개 상세 화면 작동
- [ ] Payload API 모든 데이터 조회 성공
- [ ] 푸시 알림 테스트 전송 성공
- [ ] 카메라로 영수증 사진 촬영 → 리뷰 작성 가능
- [ ] 카카오 알림톡 1건 발송 성공
- [ ] 시니어 사용자 테스트 5명 통과 (이해 시간 < 60초)

---

# Phase 3 — 앱 스토어 배포 (4주)

## 작업 단계

### 1주차: 스토어 계정 + 자산 준비

| 작업 | 비용 / 시간 |
|---|---|
| Apple Developer Program 가입 | $99/년 (가입 후 24~48시간 승인) |
| Google Play Developer 가입 | $25 (1회) |
| 사업자 등록 정보 확인 | (주) 메디록 명의로 |
| 앱 아이콘 (1024x1024) | 錄 Vault 적용, 배경 Charcoal/Gold |
| 스크린샷 (각 6장, iOS+Android 다중 사이즈) | 시니어 친화 메시지 강조 |
| 앱 설명 / 키워드 | "시니어 의료", "醫錄 인증", "임플란트 의원찾기" 등 |
| 개인정보처리방침 / 이용약관 URL | medirok.com/policy 페이지 |

### 2주차: EAS Build + 베타 배포

| 작업 | 상세 |
|---|---|
| `eas.json` 설정 | preview / production 채널 |
| `eas build --platform ios` | iOS .ipa |
| `eas build --platform android` | Android .aab |
| TestFlight 베타 배포 | iOS 내부 테스터 20명 |
| Google Play 내부 테스트 | Android 내부 테스터 20명 |
| 베타 피드백 수집 | 1주 |

### 3주차: 심사 제출

| 작업 | 상세 |
|---|---|
| iOS — App Review 제출 | 의료 카테고리 (Health & Fitness 또는 Medical) |
| Google Play — Review 제출 | "의료 / 건강" 카테고리 |
| 심사 대기 | iOS 평균 1-3일, Google 평균 1-7일 |
| 의료 정책 대응 | 의료광고법 disclaimer 자동 노출 강조 (강점) |
| 거절 시 재제출 | 흔한 거절 사유 사전 대비 |

### 4주차: 출시 + 모니터링

| 작업 | 상세 |
|---|---|
| App Store + Play Store 동시 출시 | medirok.com에 다운로드 링크 노출 |
| Sentry/Crashlytics 모니터링 | 크래시·에러 추적 |
| Firebase Analytics | 사용 패턴 분석 |
| OTA 업데이트 채널 | Expo Updates로 즉시 패치 |
| App Store Optimization (ASO) | 키워드 최적화, 리뷰 응대 |

## 의료 카테고리 심사 주의사항

| 항목 | 메디록 대응 |
|---|---|
| 의료 정보 제공 | "정보 제공이며 진단 X" disclaimer 모든 화면 |
| 의료광고 심의 | 광고 단어 사용 X, "큐레이션"으로 통일 |
| 가격 비교 | 의원 제공 자료 기반임 명시 |
| 환자 후기 | 영수증 인증 + 동의서 시스템 강조 |
| 의료 자격증 검증 | 醫錄 4단계 인증 시스템을 차별점으로 어필 |

## Phase 3 완료 기준

- [ ] App Store에 "메디록" 검색 시 노출
- [ ] Google Play에 "메디록" 검색 시 노출
- [ ] 베타 테스터 50명 중 90% 정상 작동
- [ ] 크래시율 < 1%
- [ ] 1주차 다운로드 500+

---

# 인력·비용 추정

| Phase | 기간 | 인력 | 외주 비용 (대략) | In-house |
|---|---|---|---|---|
| 1 모노레포 | 2주 | 1명 (시니어 풀스택) | 600만 | 2주 |
| 2 Expo 앱 | 8주 | 1~2명 (RN+백엔드) | 3,000만 | 8주 |
| 3 스토어 | 4주 | 1명 (RN 디자인 포함) | 500만 + Apple $99 + Google $25 | 4주 |
| **총합** | **14주** | **1-2명** | **약 4,100만원** | 약 3개월 |

---

# 모바일 앱의 결정적 가치

웹만으로 못 잡는 것:

1. **푸시 알림** = 시니어 사용자 재방문률 폭발
2. **카메라 인증** = 리뷰 신뢰도 (강남언니·모두닥 대비)
3. **위치 기반** = "내 주변 醫錄 의원" 자동
4. **카카오 알림톡** = 시니어 가장 익숙한 채널
5. **앱 스토어 노출** = "메디록" 검색 = 신뢰 도장
6. **오프라인 캐시** = 의원 정보 미리 받아두기 (시니어 데이터 절약)

---

# 진행 트리거 (이 문서를 다시 펼칠 때)

다음 조건 중 하나 충족 시 Phase 1 시작 권장:

- 醫錄 인증 의원 100곳 돌파
- 월 매거진 트래픽 10만 PV 돌파
- 무료 견적 신청 월 200건 돌파
- 영업 파트너 의원 30곳 돌파 (재방문 푸시 가치 폭발)
- 일본/영어권 진출 시점 (모바일 우선 채택)

위 중 하나라도 충족하면 → 14주 로드맵 시작.

---

**마지막 업데이트**: 2026-06-03
**상태**: 보존 / 미진행
**진행 시 시작점**: Phase 1 (PWA 없이 곧바로 모노레포 전환)
