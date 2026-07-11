// 모바일 반응형 (mobile-rollout-plan.md) — playwright.config의 "mobile" 프로젝트(Pixel 7)에서만 실행
import { test, expect, type Page } from "@playwright/test";
import { loadState } from "./helpers";

const state = loadState();

/** 뷰포트 가로 스크롤(레이아웃 오버플로) 여부 검증 */
async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, "모바일에서 가로 스크롤이 없어야 합니다").toBeLessThanOrEqual(1);
}

test.describe("모바일 — 핵심 페이지 렌더링", () => {
  test("홈이 가로 스크롤 없이 렌더되고 하단 탭바가 표시된다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "내가 직접 고른 메디록 큐레이션 의원" })
    ).toBeVisible();
    await expect(page.locator("nav.fixed.bottom-0")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("병원찾기가 가로 스크롤 없이 렌더된다", async ({ page }) => {
    await page.goto("/hospitals");

    await expect(page.getByText(/醫錄 인증 병원 \d+곳/)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("매거진 목록이 가로 스크롤 없이 렌더된다", async ({ page }) => {
    await page.goto("/magazine");

    await expect(
      page.getByRole("heading", { name: "의료의 기록 · 메디록 매거진" })
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("병원 상세가 가로 스크롤 없이 렌더된다", async ({ page }) => {
    test.skip(!state.hospitalSlug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${state.hospitalSlug}`);

    await expect(page.locator("h1").first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("매거진 상세가 가로 스크롤 없이 렌더된다", async ({ page }) => {
    test.skip(!state.magazineSlug, "Payload DB에 매거진 데이터가 없습니다");
    await page.goto(`/magazine/${state.magazineSlug}`);

    await expect(page.locator("article")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("모바일 — 병원찾기 필터 UI", () => {
  test("필터 모달이 모바일에서 열리고 닫힌다", async ({ page }) => {
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "지역" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "지역별" })).toBeVisible();

    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(dialog).toBeHidden();
  });

  test("정렬 변경이 모바일에서 동작한다", async ({ page }) => {
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "추천순" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "평점 높은순" }).click();
    await expect(page).toHaveURL(/sort=rating/);
  });
});
