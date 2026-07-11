// 대시보드 인증 (middleware.ts + dashboard-auth.ts)
import { test, expect, type Page } from "@playwright/test";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "meirok5349";

async function login(page: Page, next?: string) {
  await page.goto(next ? `/dashboard/login?next=${encodeURIComponent(next)}` : "/dashboard/login");
  await page.getByLabel("비밀번호").fill(DASHBOARD_PASSWORD);
  await page.getByRole("button", { name: "로그인" }).click();
}

test.describe("대시보드 인증", () => {
  test.describe.configure({ mode: "serial" });

  test("미인증 접근 시 next 파라미터와 함께 로그인 페이지로 리다이렉트된다", async ({
    request,
    page,
    context,
  }) => {
    const response = await request.get("/dashboard", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/dashboard\/login\?next=%2Fdashboard/);

    await context.clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login\?next=%2Fdashboard/);
    await expect(page.getByLabel("비밀번호")).toBeVisible();
  });

  test("잘못된 비밀번호는 오류를 표시한다", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/dashboard/login");
    await page.getByLabel("비밀번호").fill("wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/error=1/);
    await expect(page.getByText("비밀번호가 일치하지 않습니다.")).toBeVisible();
  });

  test("올바른 비밀번호로 대시보드에 접근한다", async ({ page, context }) => {
    await context.clearCookies();
    await login(page);

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await expect(page.getByText("등록 의원", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("매거진", { exact: true }).first()).toBeVisible();
  });

  test("로그인 후 next 경로로 복귀한다", async ({ page, context }) => {
    await context.clearCookies();
    await login(page, "/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("로그아웃하면 대시보드 재접근이 차단된다", async ({ page, context }) => {
    await context.clearCookies();
    await login(page);
    await expect(page).toHaveURL("/dashboard");

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/dashboard\/login/);

    // 쿠키가 삭제되어 재접근 시 다시 로그인으로 리다이렉트
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });
});
