import { NotFoundContent } from "@/components/NotFoundContent";

// notFound()를 호출하는 프론트엔드 라우트(없는 매거진/병원/블로그 slug 등)가 여기로 온다.
// (frontend)/layout.tsx 안에서 렌더되므로 Header·Footer가 그대로 붙는다.

export const metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "요청하신 페이지가 없습니다. 병원찾기·매거진·의원 블로그에서 원하시는 정보를 찾아보세요.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
