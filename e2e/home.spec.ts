import { test, expect } from "@playwright/test";
import { loadState } from "./helpers";

const state = loadState();

test.describe("홈페이지", () => {
  test("메인 히어로와 핵심 섹션이 표시된다", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/메디록/);
    await expect(
      page.getByRole("heading", { name: /나와 가족의 병원 선택/ }),
    ).toBeVisible();
    await expect(page.getByRole("form", { name: "병원 검색" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "메디록이 직접 살펴본 병원" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "병원 선택 전 읽어볼 가이드" })).toBeVisible();
  });

  test("큐레이션·디렉터리 카드가 병원 상세로 연결된다", async ({ page }) => {
    test.skip(state.hospitalCount === 0, "Payload DB에 병원 데이터가 없습니다");
    await page.goto("/");

    const hospitalLinks = page.locator('a[href^="/hospital/"]');
    expect(await hospitalLinks.count()).toBeGreaterThan(0);

    const href = await hospitalLinks.first().getAttribute("href");
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
    await page.getByRole("link", { name: "매거진 전체 보기" }).click();
    await expect(page).toHaveURL("/magazine");
    await expect(page.getByRole("heading", { name: "병원 선택 전 읽어볼 의료 가이드" })).toBeVisible();
  });

  test("지역과 진료과를 선택해 병원찾기로 이동한다", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("form", { name: "병원 검색" });
    await form.getByLabel("지역").selectOption({ index: 1 });
    await form.getByLabel("진료과").selectOption({ index: 1 });
    await form.getByRole("button", { name: "병원 찾기" }).click();
    await expect(page).toHaveURL(/\/hospitals\?.*sido=.*dept=/);
  });
});
