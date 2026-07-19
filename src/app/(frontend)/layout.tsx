import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

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
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+KR:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Header />
        <main className="pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}
