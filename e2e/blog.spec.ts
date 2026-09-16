import { test, expect } from "@playwright/test";
import {
  loadState,
  expectJsonLdType,
  getJsonLdSchemas,
  ogContent,
  expectCanonical,
} from "./helpers";
import { BLOG_GROUPS } from "../src/lib/blog-groups";

const state = loadState();
const blog = state.blog;

// 3레벨 IA: /blog → /blog/[hospitalSlug] → /blog/[hospitalSlug]/[slug]
// 병원 slug는 한국어라 URL에서 퍼센트 인코딩된다.
const hospitalPath = blog ? `/blog/${encodeURIComponent(blog.hospitalSlug)}` : "";
const postPath = blog ? `${hospitalPath}/${blog.postSlug}` : "";

// 원문 링크 — 원출처가 네이버 블로그일 수도, 병원 웹사이트일 수도 있다.
// 출처 박스 안의 외부 절대 URL을 원문 링크로 본다(새 창으로 여는 링크만).
const EXTERNAL_LINK = 'a[href^="http"][target="_blank"]';

test.describe("의원 블로그 목록", () => {
  test("집계 페이지가 렌더된다", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "인증 병원의 진료 이야기", exact: true })).toBeVisible();
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

  test("병원별 목록에 원본 채널 링크가 노출된다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(hospitalPath);

    // 원출처는 네이버 블로그일 수도 병원 웹사이트일 수도 있다 — 채널 표기로 찾는다.
    const sourceLink = page
      .locator('a[href^="http"]')
      .filter({ hasText: /\((네이버|웹사이트)\)/ })
      .first();
    await expect(sourceLink).toBeVisible();
    // 외부 링크는 nofollow + 새 창
    expect(await sourceLink.getAttribute("rel")).toContain("nofollow");
    expect(await sourceLink.getAttribute("target")).toBe("_blank");
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

  // ── 재작성(2026-08-03) 회귀 가드 ────────────────────────────────
  // 초판은 원문 반영률이 37~43%로 얇았고 병원 블로그의 어투가 지워져 있었다.
  // 다시 얇아지거나 원문의 광고체가 그대로 딸려 들어오는 것을 둘 다 막는다.

  // 2026-08-09: 대표 1편이 아니라 **전 편**을 훑는다. 한 편만 검사하면
  // 나중에 추가되는 글이 얇거나 광고체를 달고 들어와도 통과해 버린다.

  test("모든 글의 본문이 얇아지지 않는다 (원문 반영률 회귀 차단)", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");

    // 공백을 뺀 글자 수. 실측 3,275(라미네이트) ~ 6,392(디오디 리프팅)자다.
    // 가장 짧은 글 기준으로 여유를 두되, 초판 수준(약 2,400자)으로 되돌아가면 잡힌다.
    for (const path of blog!.allPaths) {
      await page.goto(path);
      const len = await page.evaluate(
        () =>
          (document.querySelector("article") as HTMLElement).innerText.replace(/\s/g, "").length
      );
      expect(len, `본문이 너무 짧습니다 (${path}): ${len}자`).toBeGreaterThan(3000);
    }
  });

  test("모든 글에 원문의 광고체가 딸려 들어오지 않는다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");

    for (const path of blog!.allPaths) {
      await page.goto(path);
      // 출처 박스는 제외한다 — 네이버 원문 제목("…잘하는곳…")은 있는 그대로 실어야 한다.
      const text = await page.evaluate(() => {
        const clone = document.querySelector("article")!.cloneNode(true) as HTMLElement;
        clone.querySelector('section[aria-label="원문 출처"]')?.remove();
        return clone.innerText;
      });

      // 네이버 원문의 이모지 불릿·맺음말 상투구·최상급 표현
      expect(text, `이모지 불릿이 남아 있습니다 (${path})`).not.toMatch(/[✔💡👉▶🔺✅📌■❐]/u);
      for (const banned of ["긴 글 읽어주셔", "잘하는곳", "잘하는 곳", "불안은 정보가"]) {
        expect(text, `금칙 표현이 본문에 있습니다 (${path}): ${banned}`).not.toContain(banned);
      }
    }
  });

  test("모든 글이 원출처를 밝히고 본문에 마크다운이 새지 않는다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");

    for (const path of blog!.allPaths) {
      await page.goto(path);
      // 원출처 표기가 빠지면 출처 없이 옮긴 것이 된다 (docs/content-sources.md).
      const src = page.locator('section[aria-label="원문 출처"]');
      await expect(src, `원문 출처 박스가 없습니다 (${path})`).toBeVisible();
      expect(
        await src.locator(EXTERNAL_LINK).count(),
        `원문 링크가 없습니다 (${path})`
      ).toBeGreaterThan(0);

      const body = await page.evaluate(
        () => (document.querySelector("article") as HTMLElement).innerText
      );
      expect(body, `마크다운이 그대로 노출됐습니다 (${path})`).not.toMatch(/\*\*|^## |\|---/m);
    }
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

  test("출처 표기: 원문 목록이 노출되고 원문 링크가 nofollow로 걸린다", async ({ page }) => {
    test.skip(!blog, "Payload DB에 병원 블로그 데이터가 없습니다");
    await page.goto(postPath);

    const box = page.locator('section[aria-label="원문 출처"]');
    await expect(box).toBeVisible();
    await expect(box.getByText(/재구성/)).toBeVisible();

    // 원문 링크가 sourcePosts 수만큼 있어야 한다 (채널 루트 링크 1개 추가)
    const links = box.locator(EXTERNAL_LINK);
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
    // 원문은 병원 채널(네이버 블로그·병원 웹사이트)의 절대 URL이어야 한다 — 메디록 자기 참조는 안 된다
    for (const u of isBasedOn) {
      expect(u).toMatch(/^https?:\/\//);
      expect(u).not.toContain("medirok.com");
    }

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

// ── 네트워크 병원의 블로그 그룹 (src/lib/blog-groups.ts) ──
// 여러 지점의 글을 병원 소식에서는 하나로 묶는다. 글은 실제 지점에 귀속된 채로 두고
// URL 1단계만 그룹 slug로 푼다. 지점 slug로 들어온 옛 URL은 그룹 URL로 영구 이동해야 한다.
test.describe("병원 소식 — 블로그 그룹", () => {
  type Doc = Record<string, unknown>;
  const relId = (v: unknown) =>
    v != null && typeof v === "object" ? (v as Doc).id : (v as number | string | undefined);

  test("그룹 slug가 실제 병원 slug와 겹치지 않는다", async ({ request }) => {
    const res = await request.get("/api/hospitals?limit=500&depth=0");
    expect(res.status()).toBe(200);
    const slugs = new Set(
      ((await res.json()).docs as Doc[]).map((h) => String(h.slug ?? ""))
    );
    for (const g of BLOG_GROUPS) {
      expect(slugs.has(g.slug), `그룹 slug "${g.slug}"가 병원 slug와 겹친다`).toBe(false);
    }
  });

  test("지점 slug로 들어온 목록·글 URL은 그룹 URL로 영구 이동한다", async ({ request }) => {
    const [hRes, bRes] = await Promise.all([
      request.get("/api/hospitals?limit=500&depth=0"),
      request.get("/api/blog-posts?limit=500&depth=0"),
    ]);
    const hospitals = (await hRes.json()).docs as Doc[];
    const posts = (await bRes.json()).docs as Doc[];
    const slugById = new Map(hospitals.map((h) => [h.id, String(h.slug ?? "")]));

    let checked = 0;
    for (const g of BLOG_GROUPS) {
      const groupPath = `/blog/${encodeURIComponent(g.slug)}`;
      const grouped = posts.filter((p) =>
        g.hospitalSlugs.includes(slugById.get(relId(p.hospital) as never) ?? "")
      );
      if (grouped.length === 0) continue; // 이 환경엔 그룹 글이 없다

      for (const branch of g.hospitalSlugs) {
        const res = await request.get(`/blog/${encodeURIComponent(branch)}`, { maxRedirects: 0 });
        expect(res.status(), `${branch} 목록`).toBe(308);
        expect(decodeURIComponent(res.headers()["location"] ?? "")).toContain(
          decodeURIComponent(groupPath)
        );
        checked++;
      }
      for (const p of grouped) {
        const branch = slugById.get(relId(p.hospital) as never)!;
        const slug = String(p.slug);
        const res = await request.get(
          `/blog/${encodeURIComponent(branch)}/${encodeURIComponent(slug)}`,
          { maxRedirects: 0 }
        );
        expect(res.status(), `${branch}/${slug}`).toBe(308);
        expect(decodeURIComponent(res.headers()["location"] ?? "")).toContain(
          `${decodeURIComponent(groupPath)}/${slug}`
        );
        const target = await request.get(`${groupPath}/${encodeURIComponent(slug)}`);
        expect(target.status(), `${groupPath}/${slug}`).toBe(200);
        checked++;
      }
    }
    test.skip(checked === 0, "이 환경엔 블로그 그룹에 속한 글이 없습니다");
  });

  test("병원 소식 목록에 그룹은 카드 1장으로, 그룹 페이지엔 지점 링크가 모두 있다", async ({
    page,
    request,
  }) => {
    const hRes = await request.get("/api/hospitals?limit=500&depth=0");
    const slugs = new Set(((await hRes.json()).docs as Doc[]).map((h) => String(h.slug)));
    const groups = BLOG_GROUPS.filter((g) => g.hospitalSlugs.some((s) => slugs.has(s)));

    await page.goto("/blog");
    let checked = 0;
    for (const g of groups) {
      const cards = page.getByRole("heading", { level: 3, name: g.nameKr, exact: true });
      if ((await cards.count()) === 0) continue; // 그룹 글이 없는 환경
      expect(await cards.count(), `${g.nameKr} 카드`).toBe(1);
      // 지점 이름으로 된 카드가 따로 뜨지 않는다
      for (const s of g.hospitalSlugs) {
        await expect(page.locator(`a[href="/blog/${encodeURIComponent(s)}"]`)).toHaveCount(0);
      }

      await page.goto(`/blog/${encodeURIComponent(g.slug)}`);
      const branchNav = page.getByRole("navigation", { name: `${g.nameKr} 지점` });
      await expect(branchNav).toBeVisible();
      const existing = g.hospitalSlugs.filter((s) => slugs.has(s));
      await expect(branchNav.locator('a[href^="/hospital/"]')).toHaveCount(existing.length);
      await page.goto("/blog");
      checked++;
    }
    test.skip(checked === 0, "이 환경엔 블로그 그룹에 속한 글이 없습니다");
  });
});
