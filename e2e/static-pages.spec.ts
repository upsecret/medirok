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

// 2026-08-14: 환자 대상 무료견적 폼(/estimate)을 폐지하고 병원(client) 대상
// 인증제 신청(/verification/apply)으로 교체했다. 백엔드(Payload 컬렉션 +
// 서버 액션)가 생겼으므로 예전 test.fixme 2건을 실제 테스트로 승격한다.
test.describe("醫錄 인증제 신청", () => {
  const SUBMIT = "醫錄 인증제 신청하기";

  test("신청 폼 필드가 표시된다", async ({ page }) => {
    await page.goto("/verification/apply");

    await expect(page.getByRole("heading", { name: /인증제 신청/ })).toBeVisible();
    await expect(page.getByLabel(/의원명/)).toBeVisible();
    await expect(page.getByLabel(/담당자·원장 성함/)).toBeVisible();
    await expect(page.getByLabel(/연락처/)).toBeVisible();
    await expect(page.getByText("개인정보 수집·이용 안내")).toBeVisible();
    await expect(page.getByRole("button", { name: SUBMIT })).toBeVisible();
  });

  test("필수값 없이 제출하면 브라우저 검증에 걸려 페이지를 벗어나지 않는다", async ({ page }) => {
    await page.goto("/verification/apply");
    await page.getByRole("button", { name: SUBMIT }).click();

    await expect(page).toHaveURL("/verification/apply");
    // 폼이 그대로 남아 있어야 한다 — 완료 화면으로 넘어가면 검증이 뚫린 것이다
    await expect(page.getByRole("button", { name: SUBMIT })).toBeVisible();
    await expect(page.getByRole("heading", { name: "신청이 접수되었습니다" })).toBeHidden();
  });

  test("정상 제출하면 접수 완료 안내가 표시된다", async ({ page }) => {
    await page.goto("/verification/apply");

    await page.getByLabel(/의원명/).fill("e2e 테스트치과의원");
    await page.getByLabel(/담당자·원장 성함/).fill("테스트");
    await page.getByLabel(/연락처/).fill("010-1234-5678");
    await page.getByLabel(/개인정보 수집·이용에 동의합니다/).check();
    await page.getByRole("button", { name: SUBMIT }).click();

    await expect(page.getByRole("heading", { name: "신청이 접수되었습니다" })).toBeVisible();
  });

  test("폐지된 /estimate는 신청 페이지로 넘어간다", async ({ page }) => {
    await page.goto("/estimate");
    await expect(page).toHaveURL("/verification/apply");
  });
});
