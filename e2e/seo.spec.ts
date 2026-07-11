import { test, expect } from "@playwright/test";
import { loadState, metaContent, ogContent, expectCanonical } from "./helpers";

const state = loadState();

test.describe("SEO 메타", () => {
  test("robots.txt가 크롤 규칙을 반환한다", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /dashboard");
    expect(body).toContain("Disallow: /api");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap.xml이 URL 목록을 반환한다", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>");
  });

  test("sitemap에 정적·매거진 카테고리 URL이 포함된다", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();

    for (const path of ["/hospitals", "/magazine", "/estimate", "/verification"]) {
      expect(body, `sitemap에 ${path}가 있어야 합니다`).toContain(
        `<loc>https://medirok.com${path}</loc>`
      );
    }
    expect(body).toContain("/magazine/category/regional");
  });

  test("sitemap에 병원 상세·매거진 상세 URL이 포함된다", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();

    if (state.hospitalCount > 0) {
      expect(body).toContain("https://medirok.com/hospital/");
    }
    if (state.magazineCount > 0) {
      expect(body).toContain("https://medirok.com/magazine/");
    }
  });

  test("sitemap에 admin·dashboard 경로가 포함되지 않는다", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).not.toContain("/admin");
    expect(body).not.toContain("/dashboard");
  });

  test("홈: title·description이 설정된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/메디록/);
    const desc = await metaContent(page, "description");
    expect(desc?.trim().length ?? 0).toBeGreaterThan(10);
  });

  test("병원찾기: title에 서비스명이 포함된다", async ({ page }) => {
    await page.goto("/hospitals");
    await expect(page).toHaveTitle(/병원찾기|메디록/);
  });

  test("병원 상세: OG 태그가 병원 정보를 담는다", async ({ page }) => {
    test.skip(!state.hospitalSlug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${state.hospitalSlug}`);

    expect(await ogContent(page, "title")).toContain("메디록");
    expect(await ogContent(page, "description")).toBeTruthy();
    await expectCanonical(page, `/hospital/${state.hospitalSlug}`);
  });

  test("대시보드 로그인 페이지는 noindex다", async ({ page }) => {
    await page.goto("/dashboard/login");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});
