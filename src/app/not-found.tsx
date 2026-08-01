import "./(frontend)/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotFoundContent } from "@/components/NotFoundContent";

/**
 * 매칭되는 라우트가 아예 없는 URL의 404.
 * (notFound() 호출은 (frontend)/not-found.tsx가 받으며 그쪽은 레이아웃이 붙는다)
 *
 * (frontend)·(payload) 두 라우트 그룹이 각자 레이아웃을 갖고 있어 app/ 최상위에는
 * 루트 레이아웃이 없다. 그래서 이 페이지에는 **어떤 레이아웃도 적용되지 않는다** —
 * globals.css·헤더·푸터를 여기서 직접 갖춘다.
 * 이 파일이 없으면 Next 기본 404(영문·무스타일·내비 없음)가 노출된다.
 *
 * <html>/<body>는 직접 그리지 말 것 — Next가 감싸는 셸과 중첩되어
 * "<body> cannot contain a nested <html>"로 하이드레이션이 깨진다.
 * body에 스타일을 줄 수 없으므로 sticky footer는 래퍼 div로 구현한다.
 */

export const metadata = {
  title: "페이지를 찾을 수 없습니다 | 메디록",
  description:
    "요청하신 페이지가 없습니다. 병원찾기·매거진·의원 블로그에서 원하시는 정보를 찾아보세요.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-bg)]">
      <Header />
      <main className="grow pb-16 md:pb-0">
        <NotFoundContent />
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
