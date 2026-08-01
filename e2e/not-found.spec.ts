import { test, expect } from "@playwright/test";
import { metaContent } from "./helpers";

/**
 * 404 전용 페이지.
 *
 * 진입점이 둘이고 동작 방식이 다르다 — 둘 다 같은 화면이어야 한다.
 *   1. 매칭되는 라우트가 아예 없는 URL → src/app/not-found.tsx
 *      (라우트 그룹이 둘이라 루트 레이아웃이 없어 이 파일이 헤더·푸터를 직접 갖춘다)
 *   2. notFound() 호출 (없는 매거진/병원/블로그 slug) → src/app/(frontend)/not-found.tsx
 *      ((frontend)/layout.tsx 안에서 렌더되어 헤더·푸터가 자동으로 붙는다)
 */

const UNMATCHED = "/존재하지-않는-경로";
const NOT_FOUND_CALLS = [
  "/magazine/없는글",
  "/hospital/없는병원",
  "/blog/없는병원",
  "/magazine/category/없는카테고리",
];

test.describe("404 페이지", () => {
  for (const path of [UNMATCHED, ...NOT_FOUND_CALLS]) {
    test(`${path}: 404 상태 + 한국어 안내 + 헤더·푸터`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), "404 상태코드를 반환해야 합니다").toBe(404);

      await expect(
        page.getByRole("heading", { name: "찾으시는 기록이 없습니다" })
      ).toBeVisible();

      // 막다른 길이 되지 않도록 사이트 내비게이션이 함께 나와야 한다
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    });
  }

  test("이동 카드가 실제로 살아 있는 페이지로 연결된다", async ({ page }) => {
    await page.goto(UNMATCHED);

    const cards = page.locator('main a[href^="/"]');
    const hrefs = (
      await cards.evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))
    ).filter(Boolean);

    expect(hrefs.length, "이동 링크가 있어야 합니다").toBeGreaterThanOrEqual(4);
    for (const href of [...new Set(hrefs)]) {
      const r = await page.request.get(href);
      expect(r.status(), `${href}가 200이어야 합니다`).toBe(200);
    }
  });

  test("색인되지 않도록 noindex가 설정된다", async ({ page }) => {
    await page.goto(UNMATCHED);
    const robots = await metaContent(page, "robots");
    expect(robots ?? "").toContain("noindex");
  });

  test("footer가 화면 하단에 붙는다 (콘텐츠가 짧아도)", async ({ page }) => {
    await page.goto(UNMATCHED);
    const m = await page.evaluate(() => {
      const f = document.querySelector("footer")!;
      return {
        footerBottom: f.getBoundingClientRect().bottom + window.scrollY,
        viewportHeight: window.innerHeight,
      };
    });
    expect(m.footerBottom).toBeGreaterThanOrEqual(m.viewportHeight - 1);
  });

  test("두 진입점이 같은 화면을 보여준다", async ({ page }) => {
    await page.goto(UNMATCHED);
    const a = await page.locator("main").innerText();
    await page.goto(NOT_FOUND_CALLS[0]);
    const b = await page.locator("main").innerText();
    expect(b).toBe(a);
  });
});
