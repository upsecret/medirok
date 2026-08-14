// 온디맨드 재검증 — 시드 직후 캐시를 즉시 비운다.
//
// 이 프로젝트는 드래프트 없이 운영 DB에 직접 시드하고 "시드는 즉시 라이브"를
// 전제로 굴러왔다. 그래서 콘텐츠 페이지가 전부 force-dynamic이었고, 그 대가로
// 모든 요청이 DB를 때렸다(운영 실측 no-store · TTFB 0.97~1.86s).
//
// ISR로 바꾸면서 즉시성은 이 엔드포인트가 책임진다. 시드 스크립트 뒤에
// `npm run revalidate`를 붙여 쓴다(scripts/revalidate.ts).
//
// 주의: 이걸 빠뜨리면 발행 후 최대 revalidate초 동안 옛 화면이 조용히 나간다.

import { revalidatePath } from "next/cache";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "REVALIDATE_SECRET 미설정" },
      { status: 503 },
    );
  }
  if (req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // 헤더·푸터까지 포함한 루트 레이아웃 전체를 비운다. 시드가 어떤 컬렉션을
  // 건드렸는지 스크립트마다 추적하는 것보다 통째로 비우는 편이 안전하다.
  revalidatePath("/", "layout");
  // sitemap은 레이아웃 트리 밖의 라우트 핸들러라 위 호출에 안 걸린다.
  // 새 글이 sitemap에 안 잡히면 색인이 그만큼 늦는다.
  revalidatePath("/sitemap.xml");

  return Response.json({ ok: true, revalidated: ["layout:/", "/sitemap.xml"] });
}
