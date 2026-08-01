import { test, expect } from "@playwright/test";

/**
 * sticky footer 회귀 — 콘텐츠가 짧은 페이지에서 footer가 화면 중간에 뜨면 안 된다.
 *
 * `(frontend)/layout.tsx`의 `body.min-h-dvh.flex.flex-col` + `main.grow` 조합이
 * 깨지면 footer가 콘텐츠 바로 뒤에서 멈추고 그 아래로 빈 공간이 남는다.
 * 눈으로 보기 전에는 드러나지 않아 테스트로 고정한다.
 */

// 콘텐츠가 뷰포트보다 짧아 sticky footer가 없으면 빈 공간이 생기는 경로들
const SHORT_PAGES = [
  "/blog",
  "/hospitals/서울/강남구",
  "/magazine/category/interview",
];

test.describe("레이아웃 — sticky footer", () => {
  for (const path of SHORT_PAGES) {
    test(`${path}: footer가 최소한 화면 하단까지 내려온다`, async ({ page }) => {
      const res = await page.goto(path);
      test.skip(res?.status() !== 200, `${path}가 200이 아닙니다 (데이터 없음)`);

      const m = await page.evaluate(() => {
        const footer = document.querySelector("footer");
        if (!footer) return null;
        const rect = footer.getBoundingClientRect();
        return {
          footerBottom: rect.bottom + window.scrollY,
          viewportHeight: window.innerHeight,
          docHeight: document.documentElement.scrollHeight,
        };
      });

      expect(m, "footer 엘리먼트가 있어야 합니다").not.toBeNull();
      // 서브픽셀 오차 허용
      expect(
        m!.footerBottom,
        `footer 하단(${m!.footerBottom}px)이 뷰포트 높이(${m!.viewportHeight}px)에 못 미치면 ` +
          `그 아래로 빈 공간이 남는다`
      ).toBeGreaterThanOrEqual(m!.viewportHeight - 1);
    });
  }

  test("footer가 문서의 마지막 요소다 (main 다음에 온다)", async ({ page }) => {
    await page.goto("/");
    const order = await page.evaluate(() => {
      const main = document.querySelector("main");
      const footer = document.querySelector("footer");
      if (!main || !footer) return null;
      // DOCUMENT_POSITION_FOLLOWING = footer가 main보다 뒤
      return Boolean(
        main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(order).toBe(true);
  });
});
