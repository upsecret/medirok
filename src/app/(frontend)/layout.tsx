import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

/*
  세리프 2종은 self-host한다. 예전엔 fonts.googleapis.com에서 <link>로 받았는데,
  그 스타일시트가 렌더 블로킹이면서 355~428ms에 끝났다(자체 CSS는 162~241ms).
  차단 A/B로 첫 페인트가 160~184ms 빨라지는 것을 확인했다 — 세 페이지 모두
  FCP == LCP였으므로, 이미 도착한 이미지까지 이 스타일시트가 붙잡고 있었다.

  주의: next/font 카탈로그의 Noto Serif KR subsets에는 korean이 없다. 그래도
  글리프는 빠지지 않는다 — 로더가 Google CSS를 받을 때 &subset= 파라미터를 아예
  안 붙이므로(get-google-fonts-url.js) 124개 unicode-range 슬라이스를 전부
  self-host한다. subsets 인자는 preload 대상을 고르는 용도일 뿐이다
  (loader.js: findFontFilesInCss(..., preload ? subsets : undefined)).
  한글 슬라이스는 크고 대부분의 페이지에서 즉시 필요하지 않아 preload는 끈다.
*/
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: {
    default: "메디록 · 기록으로 검증한 병원",
    template: "%s | 메디록",
  },
  description:
    "메디록이 직접 살펴본 의원만. 산부인과·피부과·치과·정형·안과·내과·검진. 자격·평점·가격·후기를 기록으로 비교하세요.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "메디록",
  },
  robots: { index: true, follow: true },
  verification: {
    other: {
      "naver-site-verification": "461386de868cca5785b39b5b0b18eff9dcaf2e51",
      "msvalidate.01": "F132D97904027FF574C0001121410E2A",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${notoSerifKr.variable}`}>
      <head>
        {/*
          Pretendard(본문 폰트)만 외부 오리진에 남는다. 이 스타일시트는 153~213ms에
          끝나 자체 CSS(162~241ms)보다 빠르므로 크리티컬 패스가 아니다 — 그래서
          오리진은 유지하고 바이트만 줄인다.

          static → dynamic-subset 교체가 그 조치다. static 빌드는 weight 하나가
          **서브셋 아닌 전체 한글 폰트**(약 750KB)라, 400·500 두 벌만 써도
          1,544,324 B를 받고 있었다. dynamic-subset은 unicode-range로 쪼개져
          실제 한국어 페이지에서 조각 9개 = 111,540 B만 내려온다(실측, −93%).
          CSS 자체는 @font-face 828개지만 압축 전송 21.6KB다.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      {/*
        sticky footer — 콘텐츠가 뷰포트보다 짧아도 footer가 화면 하단에 붙는다.
        main이 남는 높이를 흡수하지 않으면 footer가 콘텐츠 바로 뒤에서 멈춘다.
        (MobileTabBar는 position:fixed라 이 흐름에 관여하지 않는다)
      */}
      <body className="min-h-dvh flex flex-col">
        <Header />
        <main className="grow pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}
