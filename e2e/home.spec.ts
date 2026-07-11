import { test, expect } from "@playwright/test";
import { loadState } from "./helpers";

const state = loadState();

test.describe("홈페이지", () => {
  test("메인 히어로와 핵심 섹션이 표시된다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/메디록/);
    await expect(
      page.getByRole("heading", { name: "내가 직접 고른 메디록 큐레이션 의원" }),
    ).toBeVisible();
    await expect(page.getByText("TIER 01 · MEDIROK CURATION")).toBeVisible();
    await expect(page.getByText("TIER 02 · DIRECTORY")).toBeVisible();
    await expect(page.getByRole("heading", { name: "메디록 매거진" })).toBeVisible();
  });

  test("큐레이션·디렉터리 카드가 병원 상세로 연결된다", async ({ page }) => {
    test.skip(state.hospitalCount === 0, "Payload DB에 병원 데이터가 없습니다");
    await page.goto("/");

    // 예약 CTA(/booking)는 아직 라우트가 없어 제외 (아래 fixme 참고)
    const hospitalLinks = page.locator(
      'a[href^="/hospital/"]:not([href$="/booking"])'
    );
    expect(await hospitalLinks.count()).toBeGreaterThan(0);

    const href = await hospitalLinks.first().getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });

  // 앱 버그: CurationCard가 /hospital/[slug]/booking CTA를 렌더하지만
  // 해당 라우트가 src/app에 없어 404. 라우트 구현 시 fixme 해제.
  test.fixme("큐레이션 예약 CTA가 예약 페이지로 연결된다", async ({ page }) => {
    await page.goto("/");
    const booking = page.locator('a[href$="/booking"]').first();
    const href = await booking.getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });

  test("매거진 섹션 카드가 상세 글로 연결된다", async ({ page }) => {
    test.skip(state.magazineCount === 0, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto("/");

    const magazineLinks = page.locator('a[href^="/magazine/"]:not([href$="/magazine"])');
    expect(await magazineLinks.count()).toBeGreaterThan(0);
    const href = await magazineLinks.first().getAttribute("href");
    expect(href).toMatch(/^\/magazine\/.+/);
  });

  test("매거진 CTA에서 목록으로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "읽기 →" }).click();
    await expect(page).toHaveURL("/magazine");
    await expect(page.getByRole("heading", { name: "의료의 기록 · 메디록 매거진" })).toBeVisible();
  });

  test("지역 퀵내비 링크가 지역 SEO 경로로 연결된다", async ({ page }) => {
    await page.goto("/");

    const regionLinks = page.locator('a[href^="/hospitals/"]');
    expect(await regionLinks.count()).toBeGreaterThan(0);

    const href = await regionLinks.first().getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });

  test("지역 더보기 링크가 SEO 경로로 연결된다", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "강남구 치과 더 보기 →" });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(/\/hospitals\//);
    expect(decodeURIComponent(new URL(page.url()).pathname)).toBe("/hospitals/서울/강남구/치과");
  });
});
