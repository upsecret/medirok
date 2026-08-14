// 운영 캐시 워밍 — revalidate 직후 실행한다.
//
// 왜 필요한가. revalidate는 캐시를 **비우기만** 한다. 그다음 각 페이지·이미지의
// 첫 요청자가 렌더 비용과 이미지 변환 비용을 대신 물어준다. 실측으로 그 비용이
// 작지 않았다:
//
//   /_next/image 최적화기 MISS  385~415ms   (워밍된 HIT은 88ms)
//   /magazine 이미지 13장 중 5장이 421~433ms — 나머지 8장은 41~62ms
//
// 그래서 sitemap에 실린 페이지를 전부 훑고, 그 HTML의 srcset에 걸린
// /_next/image URL을 모아 미리 한 번씩 때린다. 페이지(ISR)와 이미지(최적화기)
// 캐시가 같이 데워진다.
//
// 이미지 요청에는 브라우저와 같은 Accept 헤더를 보낸다 — 최적화기는 Accept로
// AVIF/WebP를 협상하므로, 헤더가 다르면 실제 사용자가 받는 것과 **다른 캐시
// 키**를 데우게 된다.

import { SITE_URL } from "@/lib/site";

// revalidate.ts와 같은 규칙 — NEXT_PUBLIC_SITE_URL은 .env.local에서
// localhost:3000이라 쓰지 않는다. 정식 도메인의 유일한 출처는 SITE_URL이다.
const SITE = process.env.REVALIDATE_TARGET ?? SITE_URL;
const BROWSER_ACCEPT = "image/avif,image/webp,image/apng,image/*,*/*;q=0.8";
const CONCURRENCY = 6;

/** 동시 실행 수를 묶어 순차 처리 — 운영에 순간 부하를 주지 않는다. */
async function pooled<T>(items: T[], fn: (item: T) => Promise<boolean>): Promise<number> {
  let ok = 0;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++]!;
        if (await fn(item)) ok++;
      }
    }),
  );
  return ok;
}

async function main(): Promise<void> {
  const sitemapRes = await fetch(`${SITE}/sitemap.xml`);
  if (!sitemapRes.ok) {
    console.error(`✗ sitemap을 읽지 못했습니다 (${sitemapRes.status})`);
    process.exit(1);
  }
  const pages = [...(await sitemapRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1]!,
  );
  if (pages.length === 0) {
    console.error("✗ sitemap에 URL이 없습니다 — 워밍할 대상을 찾지 못했습니다.");
    process.exit(1);
  }

  // 1단계: 페이지를 훑으면서 그 안의 이미지 URL을 함께 수집한다.
  const imageUrls = new Set<string>();
  const badPages: string[] = [];
  const pagesOk = await pooled(pages, async (url) => {
    const res = await fetch(url).catch(() => null);
    if (!res?.ok) {
      badPages.push(`${res?.status ?? "연결 실패"}  ${url}`);
      return false;
    }
    const html = await res.text();
    // srcset과 src 양쪽에서 긁는다. HTML 엔티티(&amp;)를 되돌려야 실제 요청 URL이 된다.
    for (const m of html.matchAll(/["\s](\/_next\/image\?[^"\s]+)/g)) {
      imageUrls.add(new URL(m[1]!.replaceAll("&amp;", "&"), SITE).href);
    }
    return true;
  });

  // 2단계: 수집한 이미지를 브라우저와 동일한 Accept로 한 번씩 요청한다.
  const images = [...imageUrls];
  let cold = 0;
  const imagesOk = await pooled(images, async (url) => {
    const res = await fetch(url, { headers: { Accept: BROWSER_ACCEPT } }).catch(() => null);
    if (!res?.ok) return false;
    if (res.headers.get("x-vercel-cache") === "MISS") cold++;
    await res.arrayBuffer(); // 본문까지 받아야 변환이 끝나고 캐시에 들어간다
    return true;
  });

  console.log(
    `✓ 워밍 완료 — 페이지 ${pagesOk}/${pages.length}, 이미지 ${imagesOk}/${images.length} (콜드였던 것 ${cold}건)`,
  );

  // sitemap이 200이 아닌 URL을 싣고 있으면 알린다. 워밍 실패가 아니라 **사이트맵
  // 문제**이므로 종료 코드는 건드리지 않는다 — 발행할 때마다 빨간 종료가 뜨면
  // 사람이 에러를 무시하게 되고, 그러면 정작 이미지 워밍 실패를 놓친다.
  if (badPages.length > 0) {
    console.warn(`\n⚠ sitemap에 200이 아닌 URL이 ${badPages.length}건 있습니다:`);
    badPages.forEach((p) => console.warn(`   ${p}`));
    console.warn("   색인 손해로 이어지므로 라우트나 sitemap 쪽을 고쳐야 합니다.");
  }

  // 이미지 워밍 실패는 이 스크립트가 책임지는 부분이라 실패로 다룬다.
  // 놓치면 "첫 방문자만 느림"으로만 드러나서 눈에 띄지 않는다.
  if (imagesOk < images.length) {
    console.error(`✗ 이미지 ${images.length - imagesOk}건을 데우지 못했습니다.`);
    process.exit(1);
  }
}

await main();
