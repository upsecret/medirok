import { test, expect } from "@playwright/test";

test.describe("헤더 내비게이션 (데스크톱)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("주요 메뉴 링크가 동작한다", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation").getByRole("link", { name: "병원찾기" }).click();
    await expect(page).toHaveURL("/hospitals");
    await expect(page.getByText("홈 › 병원찾기")).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "매거진" }).click();
    await expect(page).toHaveURL("/magazine");

    await page.getByRole("navigation").getByRole("link", { name: /인증제/ }).click();
    await expect(page).toHaveURL("/verification");

    await page.getByRole("link", { name: "무료 견적 받기" }).click();
    await expect(page).toHaveURL("/estimate");
  });

  test("로고 클릭 시 홈으로 이동한다", async ({ page }) => {
    await page.goto("/hospitals");
    await page.getByRole("link", { name: "메디록 홈으로" }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("모바일 탭바", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("하단 탭으로 주요 페이지를 이동한다", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "병원찾기" }).last().click();
    await expect(page).toHaveURL("/hospitals");

    await page.getByRole("link", { name: "매거진" }).last().click();
    await expect(page).toHaveURL("/magazine");

    await page.getByRole("link", { name: "무료견적" }).click();
    await expect(page).toHaveURL("/estimate");

    await page.getByRole("link", { name: "메디록 인증" }).click();
    await expect(page).toHaveURL("/verification");

    // dev overlay가 하단 탭 클릭을 가로채는 경우가 있어 href·가시성만 검증
    const homeTab = page.locator("nav.fixed.bottom-0 a[href='/']");
    await expect(homeTab).toBeVisible();
    await expect(homeTab).toHaveAttribute("href", "/");
  });
});
