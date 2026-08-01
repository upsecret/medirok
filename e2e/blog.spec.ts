import { test, expect } from "@playwright/test";
import {
  loadState,
  expectJsonLdType,
  getJsonLdSchemas,
  ogContent,
  expectCanonical,
} from "./helpers";

const state = loadState();
const blog = state.blog;

// 3레벨 IA: /blog → /blog/[hospitalSlug] → /blog/[hospitalSlug]/[slug]
// 병원 slug는 한국어라 URL에서 퍼센트 인코딩된다.
const hospitalPath = blog ? `/blog/${encodeURIComponent(blog.hospitalSlug)}` : "";
const postPath = blog ? `${hospitalPath}/${blog.postSlug}` : "";

test.describe("의원 블로그 목록", () => {
  test("집계 페이지가 렌더된다", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "의원 블로그", exact: true })).toBeVisible();
  });

  test("집계 → 병원 → 글 3단계로 관통 이동한다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto("/blog");

    // 1단계 → 2단계: 병원 카드
    const hospitalCard = page.locator('a[href^="/blog/"]').first();
    expect(await hospitalCard.count()).toBeGreaterThan(0);
    await hospitalCard.click();
    await expect(page).toHaveURL(/\/blog\/[^/]+$/);

    // 2단계 → 3단계: 글 카드 (경로 깊이로 구분)
    const postCard = page.locator('a[href^="/blog/"]').filter({ hasText: /./ });
    const hrefs = await postCard.evaluateAll((els) =>
      els.map((e) => e.getAttribute("href") ?? "")
    );
    const detailHref = hrefs.find((h) => h.split("/").filter(Boolean).length === 3);
    expect(detailHref, "글 상세로 가는 링크가 있어야 합니다").toBeTruthy();

    const res = await page.request.get(detailHref!);
    expect(res.status()).toBe(200);
  });

  test("병원별 목록에 네이버 원본 블로그 링크가 노출된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(hospitalPath);

    const naverLink = page.locator('a[href*="blog.naver.com"]').first();
    await expect(naverLink).toBeVisible();
    // 외부 링크는 nofollow + 새 창
    expect(await naverLink.getAttribute("rel")).toContain("nofollow");
    expect(await naverLink.getAttribute("target")).toBe("_blank");
  });

  test("블로그 글이 없는 병원은 404를 반환한다", async ({ request }) => {
    const res = await request.get("/blog/존재하지-않는-병원");
    expect(res.status()).toBe(404);
  });
});

test.describe("의원 블로그 상세", () => {
  test("상세 페이지가 렌더되고 본문·헤더가 표시된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    const res = await page.goto(postPath);
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("article")).toBeVisible();
  });

  test("마크다운 본문이 HTML로 렌더된다 (원문 문법 노출 없음)", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const text = (await page.locator("article").innerText()).trim();
    expect(text.length).toBeGreaterThan(100);

    expect(text).not.toMatch(/^#{1,4}\s/m); // 제목 문법
    expect(text).not.toMatch(/\*\*[^*]+\*\*/); // 볼드 문법 (right-flanking 함정 회귀)
    expect(text).not.toMatch(/^\|.+\|.+\|$/m); // 표 문법
    expect(text).not.toMatch(/\[[^\]]+\]\(https?:\/\//); // 링크 문법
  });

  test("AEO: 핵심 답변(ShortAnswer) 블록이 상단에 노출된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const block = page.getByRole("region", { name: "핵심 답변" });
    await expect(block).toBeVisible();
  });

  test("AEO: FAQ 블록과 FAQPage 스키마가 함께 렌더된다", async ({ page }) => {
    test.skip(!blog?.hasFaq, "이 글에는 FAQ 블록이 없습니다");
    await page.goto(postPath);

    await expect(page.getByRole("heading", { name: "자주 묻는 질문" })).toBeVisible();
    await expect(page.locator("details").first()).toBeVisible();

    const faq = await expectJsonLdType(page, "FAQPage");
    expect((faq.mainEntity as unknown[]).length).toBeGreaterThan(0);
  });

  test("출처 표기: 원문 목록이 노출되고 네이버 링크가 nofollow로 걸린다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const box = page.locator('section[aria-label="원문 출처"]');
    await expect(box).toBeVisible();
    await expect(box.getByText(/재구성/)).toBeVisible();

    // 원문 링크가 sourcePosts 수만큼 있어야 한다 (블로그 루트 링크 1개 추가)
    const links = box.locator('a[href*="blog.naver.com"]');
    expect(await links.count()).toBeGreaterThanOrEqual(blog!.sourceCount);
    expect(await links.first().getAttribute("rel")).toContain("nofollow");
  });

  test("JSON-LD: BreadcrumbList + BlogPosting(isBasedOn/citation)이 주입된다", async ({
    page,
  }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    await expectJsonLdType(page, "BreadcrumbList");
    const posting = await expectJsonLdType(page, "BlogPosting");

    // 재구성 근거가 구조화되어 있어야 한다 — 원문 수와 일치
    const isBasedOn = posting.isBasedOn as string[];
    expect(Array.isArray(isBasedOn)).toBe(true);
    expect(isBasedOn.length).toBe(blog!.sourceCount);
    for (const u of isBasedOn) expect(u).toContain("blog.naver.com");

    const citation = posting.citation as Record<string, unknown>[];
    expect(citation.length).toBe(blog!.sourceCount);
    expect(citation[0].headline).toBeTruthy();
    expect(citation[0].datePublished).toBeTruthy();

    // 저자 의사가 설정된 글은 Person, 아니면 병원 Organization
    const author = posting.author as Record<string, unknown>;
    expect(author["@type"]).toBe(blog!.hasAuthorDoctor ? "Person" : "Organization");
  });

  test("본문 내부 링크에는 nofollow가 붙지 않는다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const internal = page.locator(
      'article a[href^="/magazine/"], article a[href^="/hospital/"]'
    );
    const count = await internal.count();
    test.skip(count === 0, "본문에 내부 링크가 없습니다");
    for (let i = 0; i < count; i++) {
      const rel = await internal.nth(i).getAttribute("rel");
      expect(rel ?? "").not.toContain("nofollow");
    }
  });

  test("의료 면책 안내가 표시된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const note = page.locator('aside[role="note"]');
    await expect(note).toBeVisible();
  });

  test("메타: seoTitle·description·OG·canonical이 설정된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    expect((await page.title()).trim().length).toBeGreaterThan(5);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc?.trim().length ?? 0).toBeGreaterThan(20);
    expect(await ogContent(page, "title")).toBeTruthy();

    await expectCanonical(page, `/blog/${blog!.hospitalSlug}/${blog!.postSlug}`);
  });

  test("병원이 다른 URL로는 접근할 수 없다 (중복 색인 방지)", async ({ request }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    const res = await request.get(
      `/blog/${encodeURIComponent("존재하지-않는-병원")}/${blog!.postSlug}`
    );
    expect(res.status()).toBe(404);
  });

  test("존재하지 않는 slug는 404를 반환한다", async ({ request }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    const res = await request.get(`${hospitalPath}/존재하지-않는-글`);
    expect(res.status()).toBe(404);
  });
});

test.describe("의원 블로그 SEO", () => {
  test("사이트맵에 블로그 URL이 포함된다", async ({ request }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();

    expect(xml).toContain("/blog");
    expect(decodeURIComponent(xml)).toContain(
      `/blog/${blog!.hospitalSlug}/${blog!.postSlug}`
    );
  });
});
