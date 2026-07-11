// 지역 SEO 페이지 (/hospitals/[sido]/[gu]/[dept]) — local-seo-개선방안.md P0 회귀 테스트
// 타이틀 상위지역 포함 · canonical · noindex · JSON-LD(BreadcrumbList/ItemList/FAQPage) · 내부링크
import { test, expect } from "@playwright/test";
import {
  loadState,
  expectJsonLdType,
  expectCanonical,
  metaContent,
  getJsonLdSchemas,
} from "./helpers";

const state = loadState();
const region = state.region;
const base = region ? `/hospitals/${region.sido}/${region.gu}/${region.dept}` : null;

test.describe("지역 SEO — 경로 렌더링", () => {
  test("시도 페이지가 렌더되고 BreadcrumbList가 주입된다", async ({ page }) => {
    test.skip(!region, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    const res = await page.goto(`/hospitals/${region!.sido}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expectJsonLdType(page, "BreadcrumbList");
    await expectCanonical(page, `/hospitals/${region!.sido}`);
  });

  test("시군구 페이지가 렌더되고 타이틀에 전체 지역명이 포함된다", async ({ page }) => {
    test.skip(!region, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    const res = await page.goto(`/hospitals/${region!.sido}/${region!.gu}`);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(
      new RegExp(`${region!.sidoName} ${region!.guName}`)
    );
    await expectJsonLdType(page, "BreadcrumbList");
    await expectCanonical(page, `/hospitals/${region!.sido}/${region!.gu}`);
  });

  test("지역×진료과 페이지가 렌더된다 (H1·인트로·FAQ)", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    const res = await page.goto(base!);
    expect(res?.status()).toBe(200);

    // H1: "{시도} {구} {진료과}"
    await expect(page.locator("h1").first()).toContainText(
      `${region!.guName} ${region!.dept}`
    );
    // 인트로 카피 (thin content 보완)
    await expect(page.getByText(/4단계.*(직접 검증|인증)/).first()).toBeVisible();
    // 본문 FAQ <details>
    await expect(
      page.getByRole("heading", { name: "자주 묻는 질문" })
    ).toBeVisible();
    await expect(page.locator("details").first()).toBeVisible();
  });

  test("존재하지 않는 지역 경로는 404를 반환한다", async ({ request }) => {
    const res = await request.get("/hospitals/없는시도/없는구/없는과");
    expect(res.status()).toBe(404);
  });
});

test.describe("지역 SEO — 메타 (P0 회귀)", () => {
  test("타이틀에 상위 지역명이 포함된다 (예: 서울 강남구 치과)", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    // "구 진료과"만 있고 시·도가 빠지면 P0 회귀 (local-seo-개선방안.md)
    await expect(page).toHaveTitle(
      new RegExp(`${region!.sidoName} ${region!.guName} ${region!.dept}`)
    );
  });

  test("canonical이 지역×진료과 전체 페이지를 가리킨다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    await expectCanonical(page, base!);
    // 병원이 있는 조합이므로 색인 허용
    const robots = await metaContent(page, "robots");
    if (robots) expect(robots).not.toContain("noindex");
  });

  test("동(洞) 필터 URL은 noindex + canonical 고정이다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(`${base}?dong=테스트동`);
    const robots = await metaContent(page, "robots");
    expect(robots, "?dong= 필터 페이지는 noindex여야 합니다").toContain("noindex");
    // canonical은 쿼리 없는 전체 페이지로 고정
    await expectCanonical(page, base!);
  });
});

test.describe("지역 SEO — JSON-LD (AEO/GEO)", () => {
  test("BreadcrumbList가 홈→병원찾기→시도→구→진료과 5단계를 담는다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    const crumb = await expectJsonLdType(page, "BreadcrumbList");
    const items = crumb.itemListElement as Array<{ name: string; position: number }>;
    expect(items.length).toBe(5);
    expect(items[0].name).toBe("홈");
    expect(items[4].name).toBe(region!.dept);
  });

  test("ItemList에 인증 병원 목록이 담긴다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    const list = await expectJsonLdType(page, "ItemList");
    const items = list.itemListElement as unknown[];
    expect(items.length).toBeGreaterThan(0);
  });

  test("FAQPage 스키마가 본문 FAQ와 함께 주입된다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    const faq = await expectJsonLdType(page, "FAQPage");
    const questions = faq.mainEntity as Array<{ "@type": string; name: string }>;
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]["@type"]).toBe("Question");
    // 본문 <details> 질문 수와 JSON-LD 질문 수 일치 (렌더-스키마 동기화)
    // FaqBlock 공용화 이후 section[aria-label]로 유일하게 스코프
    const detailsCount = await page
      .locator('section[aria-label="자주 묻는 질문"] details')
      .count();
    expect(detailsCount).toBe(questions.length);
  });

  test("모든 JSON-LD 블록이 유효한 JSON이다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    const schemas = await getJsonLdSchemas(page); // 파싱 실패 시 throw
    expect(schemas.length).toBeGreaterThanOrEqual(2);
    for (const s of schemas) {
      expect(s["@context"]).toContain("schema.org");
    }
  });
});

test.describe("지역 SEO — 내부링크", () => {
  test("브레드크럼 내비게이션이 상위 지역 페이지로 연결된다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);
    // 헤더 nav가 아닌 브레드크럼 nav("홈 ›")를 선택
    const crumb = page.locator("nav").filter({ hasText: "홈 ›" });
    await expect(crumb.getByRole("link", { name: "병원찾기" })).toBeVisible();
    await expect(crumb.getByRole("link", { name: region!.sidoName })).toBeVisible();
    await expect(crumb.getByRole("link", { name: region!.guName })).toBeVisible();
  });

  test("인근 지역·다른 진료과 내부링크가 유효한 SEO 경로다", async ({ page }) => {
    test.skip(!base, "병원 데이터가 없어 지역 샘플을 만들 수 없습니다");
    await page.goto(base!);

    // 내부링크 섹션이 렌더되면 링크가 /hospitals/{sido}/ 형태여야 한다
    const crossLinks = page.locator(
      `section a[href^="/hospitals/${region!.sido}/"], section a[href^="/hospitals/${encodeURIComponent(
        region!.sido
      )}/"]`
    );
    const count = await crossLinks.count();
    test.skip(count === 0, "인근 지역/진료과 내부링크 섹션이 없습니다 (지역·진료과 1개뿐)");

    // 첫 링크가 실제 200/렌더 가능한 페이지인지 확인
    const href = await crossLinks.first().getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });
});
