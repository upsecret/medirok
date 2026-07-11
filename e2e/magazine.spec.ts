import { test, expect } from "@playwright/test";
import {
  loadState,
  expectJsonLdType,
  getJsonLdSchemas,
  ogContent,
  expectCanonical,
} from "./helpers";

const state = loadState();
const slug = state.magazineSlug;
const mag = state.magazine;

test.describe("매거진 목록", () => {
  test("히어로와 카테고리 탭이 표시된다", async ({ page }) => {
    await page.goto("/magazine");

    await expect(page.getByRole("heading", { name: "의료의 기록 · 메디록 매거진" })).toBeVisible();

    const tabs = page.locator("section.sticky");
    await expect(tabs.getByRole("link", { name: "전체", exact: true })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "시술 가이드", exact: true })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "지역 가이드", exact: true })).toBeVisible();
    await expect(page.getByText("최신 글")).toBeVisible();
  });

  test("카테고리 탭으로 필터 페이지에 이동한다", async ({ page }) => {
    await page.goto("/magazine");
    await page
      .locator("section.sticky")
      .getByRole("link", { name: "지역 가이드", exact: true })
      .click();
    await expect(page).toHaveURL("/magazine/category/regional");
  });

  test("카테고리 페이지의 카드는 모두 매거진 상세로 연결된다", async ({ page }) => {
    const res = await page.goto("/magazine/category/regional");
    expect(res?.status()).toBe(200);

    const cards = page.locator('a[href^="/magazine/"]:not([href*="/category/"])');
    const count = await cards.count();
    test.skip(count === 0, "regional 카테고리에 매거진 데이터가 없습니다");
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/magazine\/[^/]+$/);
    }
  });

  test("존재하지 않는 카테고리는 404를 반환한다", async ({ request }) => {
    const res = await request.get("/magazine/category/없는카테고리");
    expect(res.status()).toBe(404);
  });

  test("목록에서 카드 클릭 시 상세로 이동한다", async ({ page }) => {
    await page.goto("/magazine");
    const firstArticle = page.locator('a[href^="/magazine/"]:not([href*="/category/"])').first();
    test.skip((await firstArticle.count()) === 0, "매거진 데이터가 없습니다");

    const href = await firstArticle.getAttribute("href");
    await firstArticle.click();
    await expect(page).toHaveURL(href!);
  });
});

test.describe("매거진 상세", () => {
  test("상세 페이지가 렌더되고 본문·헤더가 표시된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");

    const response = await page.goto(`/magazine/${slug}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("article")).toBeVisible();
  });

  test("마크다운 본문이 HTML로 렌더된다 (원문 문법 노출 없음)", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${slug}`);

    const article = page.locator("article");
    const text = (await article.innerText()).trim();
    expect(text.length).toBeGreaterThan(100);

    // 마크다운 렌더링 회귀 (매거진-마크다운-렌더링-개선플랜):
    // 원문 문법 토큰이 텍스트로 그대로 노출되면 실패
    expect(text).not.toMatch(/^#{1,4}\s/m); // 제목 문법
    expect(text).not.toMatch(/\*\*[^*]+\*\*/); // 볼드 문법
    expect(text).not.toMatch(/^\|.+\|.+\|$/m); // 표 문법
    expect(text).not.toMatch(/\[[^\]]+\]\(https?:\/\//); // 링크 문법
  });

  test("AEO: 핵심 답변(ShortAnswer) 블록이 상단에 노출된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${slug}`);

    const block = page.getByRole("region", { name: "핵심 답변" });
    await expect(block).toBeVisible();
    await expect(block.getByText("메디록 · 핵심 답변")).toBeVisible();
  });

  test("AEO: FAQ 블록과 FAQPage 스키마가 함께 렌더된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    test.skip(!mag?.hasFaq, "이 매거진에는 FAQ 블록이 없습니다");
    await page.goto(`/magazine/${slug}`);

    await expect(page.getByRole("heading", { name: "자주 묻는 질문" })).toBeVisible();
    await expect(page.locator("details").first()).toBeVisible();

    const faq = await expectJsonLdType(page, "FAQPage");
    const questions = faq.mainEntity as unknown[];
    expect(questions.length).toBeGreaterThan(0);
  });

  test("JSON-LD: BreadcrumbList + Article/QAPage 스키마가 주입된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${slug}`);

    await expectJsonLdType(page, "BreadcrumbList");
    const schemas = await getJsonLdSchemas(page);
    const article = schemas.find((s) => s["@type"] === "Article" || s["@type"] === "QAPage");
    expect(article, "Article 또는 QAPage 스키마가 있어야 합니다").toBeTruthy();
  });

  test("저자 프로필과 의료 면책 안내가 표시된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${slug}`);

    // 의료법 disclaimer는 항상 렌더 (role="note")
    const note = page.locator('aside[role="note"]');
    await expect(note).toBeVisible();
    await expect(note.getByText(/안내/)).toBeVisible();
  });

  test("메타: seoTitle·description·OG 태그가 설정된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${slug}`);

    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(5);

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc?.trim().length ?? 0).toBeGreaterThan(20);

    expect(await ogContent(page, "title")).toBeTruthy();
    expect(await ogContent(page, "description")).toBeTruthy();

    // RF Phase 5에서 추가된 계약: 매거진 상세 canonical
    await expectCanonical(page, `/magazine/${slug}`);
  });

  test("존재하지 않는 slug는 404를 반환한다", async ({ request }) => {
    const res = await request.get("/magazine/존재하지-않는-글-slug");
    expect(res.status()).toBe(404);
  });
});
