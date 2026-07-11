import { test, expect } from "@playwright/test";

test.describe("醫錄 인증제", () => {
  test("4단계 인증 소개가 표시된다", async ({ page }) => {
    await page.goto("/verification");

    await expect(page.getByRole("heading", { name: /4단계 의원 인증제/ })).toBeVisible();
    await expect(page.getByText("진료 이력 검증")).toBeVisible();
    await expect(page.getByText("실방문자 후기 검증")).toBeVisible();
    await expect(page.getByText("의료진 자격 검증")).toBeVisible();
    await expect(page.getByText("시설·장비 검증")).toBeVisible();
  });
});

test.describe("무료 견적", () => {
  test("견적 폼 필드가 표시된다", async ({ page }) => {
    await page.goto("/estimate");

    await expect(page.getByRole("heading", { name: "백내장·임플란트 무료 견적" })).toBeVisible();
    await expect(page.getByText("메디록 인증 의원만 매칭")).toBeVisible();
    await expect(page.getByText("시술 선택")).toBeVisible();
    await expect(page.getByText("희망 지역")).toBeVisible();
    await expect(page.getByText("연령대")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "메디록 인증 의원 3곳 견적 받기" })
    ).toBeVisible();
  });

  // 폼 제출 백엔드(action/필수값 검증)가 아직 미구현 — 구현 시 fixme 해제
  test.fixme("필수값 없이 제출하면 검증 오류가 표시된다", async ({ page }) => {
    await page.goto("/estimate");
    await page.getByRole("button", { name: "메디록 인증 의원 3곳 견적 받기" }).click();
    // 기대: 연락처(tel) 필수값 검증 메시지 노출, 페이지 이탈 없음
    await expect(page).toHaveURL("/estimate");
  });

  test.fixme("견적 요청 제출 성공 시 완료 안내가 표시된다", async ({ page }) => {
    await page.goto("/estimate");
    await page.locator('input[type="tel"]').fill("010-1234-5678");
    await page.getByRole("button", { name: "메디록 인증 의원 3곳 견적 받기" }).click();
    // 기대: 제출 완료 화면/토스트 (백엔드 구현 후 어서션 확정)
  });
});
