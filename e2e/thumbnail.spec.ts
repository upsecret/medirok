import { test, expect, type Page } from "@playwright/test";
import { loadState, ogContent, getJsonLdSchemas } from "./helpers";

/**
 * 매거진·블로그 대표 이미지.
 *
 * 썸네일은 optional 필드라 두 경로를 모두 지켜야 한다.
 *   있는 문서 → 이미지가 실제로 로드되고 alt가 있고 OG/JSON-LD에 절대 URL로 실린다
 *   없는 문서 → 플레이스홀더로 렌더되며 200이다 (조건부 생략이면 카드 높이가 어긋난다)
 *
 * next/image는 src가 404여도 <img>를 남기므로 존재 여부가 아니라 naturalWidth로 판정한다.
 * 카드 썸네일은 lazy이므로 측정 전에 끝까지 스크롤한다.
 */

const state = loadState();

/** 페이지 끝까지 스크롤해 lazy 이미지를 모두 깨운다 */
async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForLoadState("networkidle");
}

/** 로드에 실패한 이미지의 src 목록 */
async function brokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("main img, article img")]
      .filter((i) => (i as HTMLImageElement).naturalWidth === 0)
      .map((i) => i.getAttribute("src") ?? "(src 없음)")
  );
}

test.describe("대표 이미지", () => {
  test("매거진 목록: 카드 이미지가 실제로 로드되고 깨진 것이 없다", async ({ page }) => {
    await page.goto("/magazine");
    await scrollToBottom(page);

    const imgs = page.locator("main img");
    expect(await imgs.count(), "카드 썸네일이 하나 이상 있어야 합니다").toBeGreaterThan(0);
    expect(await brokenImages(page), "깨진 이미지가 없어야 합니다").toEqual([]);
  });

  test("모든 이미지에 alt가 있다", async ({ page }) => {
    await page.goto("/magazine");
    await scrollToBottom(page);
    const noAlt = await page.evaluate(() =>
      [...document.querySelectorAll("main img")]
        .filter((i) => !(i.getAttribute("alt") ?? "").trim())
        .map((i) => i.getAttribute("src") ?? "")
    );
    expect(noAlt, "alt가 빈 이미지가 없어야 합니다").toEqual([]);
  });

  test("썸네일 없는 매거진도 목록에서 같은 높이를 유지한다", async ({ page }) => {
    test.skip(
      !state.thumbnail.magazineWithoutSlug || !state.thumbnail.magazineSlug,
      "썸네일 유/무 매거진이 모두 있어야 비교할 수 있습니다"
    );
    await page.goto("/magazine");
    await scrollToBottom(page);

    // 같은 그리드 안에서는 이미지 영역(16:9 박스) 높이가 카드마다 같아야 한다.
    // 그리드가 다르면 카드 폭이 달라 높이도 정당하게 달라지므로 부모 단위로 묶어 비교한다.
    const groups = await page.evaluate(() => {
      const byParent = new Map<Element, number[]>();
      for (const a of document.querySelectorAll('main a[href^="/magazine/"]')) {
        const box = a.querySelector("div");
        if (!box || !a.parentElement) continue;
        const h = Math.round(box.getBoundingClientRect().height);
        if (h <= 0) continue;
        const list = byParent.get(a.parentElement) ?? [];
        list.push(h);
        byParent.set(a.parentElement, list);
      }
      return [...byParent.values()].filter((v) => v.length > 1);
    });

    expect(groups.length, "카드가 2개 이상인 그리드가 있어야 합니다").toBeGreaterThan(0);
    for (const heights of groups) {
      const uniq = [...new Set(heights)];
      expect(
        uniq.length,
        `같은 그리드 안에서 이미지 영역 높이가 제각각입니다: ${uniq.join(", ")}`
      ).toBe(1);
    }
  });

  test("매거진 상세: 히어로 이미지 + OG + JSON-LD image", async ({ page }) => {
    test.skip(!state.thumbnail.magazineSlug, "썸네일이 설정된 매거진이 없습니다");
    await page.goto(`/magazine/${state.thumbnail.magazineSlug}`);

    const hero = page.locator("article img").first();
    await expect(hero).toBeVisible();
    expect(await brokenImages(page)).toEqual([]);

    const og = await ogContent(page, "image");
    expect(og, "og:image가 있어야 합니다").toBeTruthy();
    expect(og, "og:image는 절대 URL이어야 합니다").toMatch(/^https?:\/\//);

    const schemas = await getJsonLdSchemas(page);
    const withImage = schemas.find((s) => typeof s.image === "string");
    expect(withImage, "JSON-LD에 image가 실려야 합니다").toBeTruthy();
    expect(String(withImage?.image)).toMatch(/^https?:\/\//);
  });

  test("썸네일 없는 매거진 상세도 200으로 열린다", async ({ page }) => {
    test.skip(!state.thumbnail.magazineWithoutSlug, "썸네일 없는 매거진이 없습니다");
    const res = await page.goto(`/magazine/${state.thumbnail.magazineWithoutSlug}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    // 히어로는 생략되지만 og:image도 없어야 한다 (빈 값을 내보내면 크롤러가 깨진 링크를 읽는다)
    const og = await ogContent(page, "image");
    expect(og ?? "").not.toMatch(/undefined|null/);
  });

  test("블로그 상세: 히어로 이미지 + BlogPosting image", async ({ page }) => {
    test.skip(
      !state.thumbnail.blogHospitalSlug || !state.thumbnail.blogPostSlug,
      "썸네일이 설정된 블로그 글이 없습니다"
    );
    await page.goto(
      `/blog/${encodeURIComponent(state.thumbnail.blogHospitalSlug!)}/${encodeURIComponent(
        state.thumbnail.blogPostSlug!
      )}`
    );
    await scrollToBottom(page);
    expect(await brokenImages(page)).toEqual([]);

    const schemas = await getJsonLdSchemas(page);
    const posting = schemas.find((s) => s["@type"] === "BlogPosting");
    expect(posting, "BlogPosting 스키마가 있어야 합니다").toBeTruthy();
    expect(String(posting?.image ?? ""), "BlogPosting.image가 절대 URL이어야 합니다").toMatch(
      /^https?:\/\//
    );
  });

  test("블로그 집계 페이지 카드에도 이미지가 있다", async ({ page }) => {
    test.skip(!state.blog, "블로그 글이 없습니다");
    await page.goto("/blog");
    await scrollToBottom(page);
    expect(await page.locator("main img").count()).toBeGreaterThan(0);
    expect(await brokenImages(page)).toEqual([]);
  });

  test("publisher 로고가 실제로 존재한다", async ({ page }) => {
    // JSON-LD가 가리키는 publisher.logo.url이 404면 구조화 데이터가 무효가 된다
    const res = await page.request.get("/logo.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toContain("image");
  });
});
