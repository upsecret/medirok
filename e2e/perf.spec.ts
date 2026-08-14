import { test, expect } from "@playwright/test";

/**
 * 2026-08-14 성능 감사에서 고친 회귀들을 고정한다.
 * 둘 다 "설정 한 줄이 빠져서 전체가 느린 경로로 흐르던" 종류라 눈에 띄지 않는다.
 * 자세한 근거는 docs/성능-감사-2026-08.md.
 *
 * 주의: dev 서버(playwright webServer)는 캐시 헤더를 운영과 다르게 낸다.
 * 그래서 CDN 캐시 여부가 아니라 **원인이 된 코드 상태**를 검증한다.
 */

test.describe("성능 회귀 가드", () => {
  test("콘텐츠 라우트에 force-dynamic이 다시 붙지 않는다", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const root = path.resolve(process.cwd(), "src/app/(frontend)");
    const offenders: string[] = [];

    // force-dynamic이 정당한 유일한 경우는 요청별 인증이 필요한 라우트다.
    const ALLOWED = ["dashboard", "revalidate"];

    const walk = async (dir: string): Promise<void> => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        if (entry.name !== "page.tsx" && entry.name !== "route.ts") continue;
        const rel = path.relative(root, full);
        if (ALLOWED.some((a) => rel.startsWith(a))) continue;
        const src = await fs.readFile(full, "utf8");
        if (/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(src)) {
          offenders.push(rel);
        }
      }
    };
    await walk(root);

    // force-dynamic을 쓰면 그 라우트는 CDN에 절대 캐시되지 않는다.
    // 즉시 반영이 필요하면 ISR + /revalidate 엔드포인트를 쓴다.
    expect(offenders, "force-dynamic 대신 revalidate + /revalidate 를 쓸 것").toEqual([]);
  });

  test("동적 세그먼트 라우트에 generateStaticParams가 있다", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    // 동적 세그먼트에 generateStaticParams가 없으면 Next가 prerender 매니페스트에
    // 항목을 만들지 않아 revalidate 선언이 통째로 무시된다.
    // 아래 두 곳은 사유를 코드 주석에 남기고 의도적으로 제외한 라우트다.
    const KNOWN_DYNAMIC = [
      path.join("hospitals", "[sido]", "[gu]", "[dept]"), // searchParams(dong) 의존
      path.join("hospitals", "역", "[line]", "[station]"), // 프리렌더가 InvalidCharacterError
    ];

    const root = path.resolve(process.cwd(), "src/app/(frontend)");
    const missing: string[] = [];

    const walk = async (dir: string): Promise<void> => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        if (entry.name !== "page.tsx") continue;
        const rel = path.relative(root, path.dirname(full));
        if (!rel.includes("[")) continue;
        if (KNOWN_DYNAMIC.includes(rel)) continue;
        const src = await fs.readFile(full, "utf8");
        if (!src.includes("generateStaticParams")) missing.push(rel);
      }
    };
    await walk(root);

    expect(missing, "revalidate만 선언하면 무시된다 — generateStaticParams가 필요하다").toEqual([]);
  });

  test("이미지가 /api/media/file 프록시를 직접 가리키지 않는다", async ({ page }) => {
    // Blob 토큰이 없는 환경(e2e docker)은 로컬 디스크 폴백이라 프록시 경로가 정상이다.
    // 그때는 검증할 게 없다 — 운영에서만 의미가 있는 가드다.
    test.skip(!process.env.BLOB_READ_WRITE_TOKEN, "Blob 미사용 환경");

    await page.goto("/magazine");
    const srcs = await page.locator("main img").evaluateAll((els) =>
      els.map((e) => (e as HTMLImageElement).getAttribute("src") ?? ""),
    );
    for (const src of srcs) {
      const target = decodeURIComponent(src);
      expect(
        target.includes("/api/media/file/"),
        `이미지가 서버리스 프록시를 경유한다: ${src}`,
      ).toBe(false);
    }
  });

  test("렌더 블로킹 외부 폰트 오리진이 다시 늘지 않는다", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    // 2026-08-15 측정: fonts.googleapis.com 스타일시트가 렌더 블로킹인데
    // 355~428ms에 끝나 첫 페인트를 붙잡고 있었다(자체 CSS는 162~241ms).
    // 차단 A/B로 FCP가 160~184ms 빨라지는 것을 확인하고 next/font로 옮겼다.
    // 세리프 폰트를 다시 <link>로 되돌리면 그 손해가 그대로 돌아온다.
    const layout = await fs.readFile(
      path.resolve(process.cwd(), "src/app/(frontend)/layout.tsx"),
      "utf8",
    );

    // href만 본다 — 위 사연을 적어 둔 주석에도 도메인이 등장한다.
    const hrefs = [...layout.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]!);

    expect(
      hrefs.filter((h) => h.includes("fonts.googleapis.com")),
      "세리프 폰트는 next/font로 self-host한다",
    ).toEqual([]);
    expect(
      hrefs.filter((h) => h.includes("fonts.gstatic.com")),
      "self-host하면 gstatic preconnect는 죽은 힌트다",
    ).toEqual([]);
    // Pretendard는 외부 오리진에 남기지만 반드시 서브셋 빌드여야 한다.
    // static 빌드는 weight 하나가 전체 한글 폰트(약 750KB)라 2벌에 1.49MB였다.
    for (const href of hrefs.filter((h) => h.includes("pretendard"))) {
      expect(href, "Pretendard는 dynamic-subset 빌드만 쓴다").toContain(
        "pretendard-dynamic-subset",
      );
    }
  });

  test("이미지에 blur 플레이스홀더가 실린다", async ({ page }) => {
    // next/image는 placeholder="blur"를 인라인 background-image로 심는다.
    // 로드 완료 후 지워지므로 **서버가 내려준 HTML**에서 확인한다.
    const res = await page.request.get("/magazine");
    const html = await res.text();

    expect(html.includes("<img"), "이 페이지에 이미지가 있어야 의미 있는 검증이다").toBe(
      true,
    );
    // 백필/업로드 훅이 blurDataURL을 채우지 못하면 조용히 회색 박스로 돌아간다.
    expect(
      html.includes("data:image/webp;base64"),
      "blurDataURL이 비어 있다 — Media 업로드 훅이나 백필을 확인할 것",
    ).toBe(true);
  });
});
