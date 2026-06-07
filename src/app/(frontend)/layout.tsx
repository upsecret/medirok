import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "메디록 · 내가 직접 고른 인증 의원",
    template: "%s | 메디록",
  },
  description:
    "메디록 4단계 인증 + 큐레이션을 통과한 의원만. 산부인과·피부과·치과·정형·안과·내과·검진. 평점·가격·후기를 직접 비교하세요.",
  metadataBase: new URL("https://medirok.com"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "메디록",
  },
  robots: { index: true, follow: true },
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
