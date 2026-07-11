import { test, expect } from "@playwright/test";
import { loadState, expectJsonLdType, expectCanonical } from "./helpers";

const state = loadState();
const noHospitals = state.hospitalCount === 0;

test.describe("병원찾기", () => {
  test("필터 칩바와 결과 카운터가 표시된다", async ({ page }) => {
    await page.goto("/hospitals");

    await expect(page.getByText("홈 › 병원찾기")).toBeVisible();
    await expect(page.getByRole("button", { name: "지역" })).toBeVisible();
    await expect(page.getByRole("button", { name: "진료과" })).toBeVisible();
    await expect(page.getByRole("button", { name: "추천순" })).toBeVisible();
    await expect(page.getByText(/醫錄 인증 병원 \d+곳/)).toBeVisible();
  });

  test("지역 선택 모달을 열고 닫을 수 있다", async ({ page }) => {
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "지역" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "지역별" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "역주변" })).toBeVisible();

    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(dialog).toBeHidden();
  });

  test("진료과 필터 적용 시 URL에 dept 파라미터가 반영된다", async ({ page }) => {
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "진료과" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "전체 진료과" })).toBeVisible();

    // 진료과 그리드에서 "전체 진료과" 다음 첫 셀 선택 (아이콘 버튼 오클릭 방지)
    const cells = dialog.locator(".grid button");
    test.skip((await cells.count()) < 2, "선택 가능한 진료과가 없습니다");
    const firstDept = cells.nth(1);
    const deptName = (await firstDept.textContent())?.trim() ?? "";
    await firstDept.click();

    await expect(page).toHaveURL(/dept=/);
    // 칩바 라벨이 선택한 진료과로 바뀐다
    await expect(page.getByRole("button", { name: deptName }).first()).toBeVisible();
  });

  test("정렬을 평점 높은순으로 변경하면 URL에 sort 파라미터가 반영된다", async ({
    page,
  }) => {
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "추천순" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "평점 높은순" }).click();

    await expect(page).toHaveURL(/sort=rating/);
    await expect(page.getByRole("button", { name: "평점 높은순" })).toBeVisible();
  });

  test("조건에 맞는 병원이 없으면 빈 상태 안내가 표시된다", async ({ page }) => {
    await page.goto("/hospitals?dept=존재하지않는진료과");
    await expect(
      page.getByText("선택한 조건에 맞는 醫錄 인증 병원이 아직 없습니다.")
    ).toBeVisible();
  });

  test("퀵뷰에서 병원 상세 페이지로 이동한다", async ({ page }) => {
    test.skip(noHospitals, "Payload DB에 병원 데이터가 없습니다");
    await page.goto("/hospitals");

    const firstRow = page
      .locator("section")
      .filter({ hasText: "醫錄 인증 병원" })
      .locator("button")
      .filter({ has: page.locator("h3") })
      .first();
    await firstRow.click();

    const quickView = page.getByRole("dialog");
    await expect(quickView).toBeVisible();
    await quickView.getByRole("link", { name: "자세히 보기" }).click();

    await expect(page).toHaveURL(/\/hospital\/.+/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("병원 상세", () => {
  const slug = state.hospitalSlug;

  test("slug 페이지가 200을 반환하고 핵심 섹션이 렌더된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");

    const response = await page.goto(`/hospital/${slug}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator("h1").first()).toBeVisible();
    // 핵심 섹션: 진료/가격 · 의료진 · 실방문 후기 · 위치/진료시간
    await expect(page.getByRole("heading", { name: "진료 / 가격" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /의료진 \(\d+명\)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /실방문 후기 \(\d+\)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "위치 · 진료시간" })).toBeVisible();
  });

  test("4단계 인증 박스가 표시된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    await expect(page.getByText("메디록 4단계 의원 인증").first()).toBeVisible();
    await expect(page.getByText("진료 이력", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("실방문 후기", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("의료진", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("시설·장비", { exact: true }).first()).toBeVisible();
  });

  test("JSON-LD에 BreadcrumbList와 MedicalOrganization이 주입된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    await expectJsonLdType(page, "BreadcrumbList");
    const org = await expectJsonLdType(page, "MedicalOrganization");
    expect(org.name, "MedicalOrganization.name이 있어야 합니다").toBeTruthy();
    expect(String(org.url)).toContain("/hospital/");
  });

  test("메타: 타이틀·canonical이 병원 정보를 담는다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    await expect(page).toHaveTitle(/메디록 인증/);
    await expectCanonical(page, `/hospital/${slug}`);
  });

  test("브레드크럼이 지역 SEO 페이지로 연결된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    // 헤더 nav가 아닌 브레드크럼 nav("홈 ›")를 선택
    const crumb = page.locator("nav").filter({ hasText: "홈 ›" });
    await expect(crumb.getByRole("link", { name: "병원찾기" })).toBeVisible();
    // 지역 정보가 있는 병원이면 /hospitals/ SEO 경로 링크가 있어야 한다
    const regionLinks = crumb.locator('a[href^="/hospitals/"]:not([href="/hospitals"])');
    expect(await regionLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test("존재하지 않는 slug는 404를 반환한다", async ({ request }) => {
    const res = await request.get("/hospital/존재하지-않는-병원-slug");
    expect(res.status()).toBe(404);
  });

  // slug→FK 전환: doctors 컬렉션 승격으로 "의원 소속 의사 → 그 의사가 쓴 매거진"
  // 역방향 cross-link가 가능해졌다 (getMagazinesByDoctorSlugs).
  test('의료진 cross-link: "의료진이 직접 쓴 글" 섹션이 매거진으로 연결된다', async ({
    page,
  }) => {
    const hSlug = state.crossLinks.hospitalWithAuthoredMagsSlug;
    test.skip(!hSlug, "소속 의사가 매거진을 쓴 의원이 없습니다");
    await page.goto(`/hospital/${hSlug}`);

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /의료진이 직접 쓴 글/ }),
    });
    await expect(section).toBeVisible();
    const cards = section.locator('a[href^="/magazine/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    const href = await cards.first().getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });
});

test.describe("역주변 SEO 페이지", () => {
  // 앱 버그(검증 필요): /hospitals/역/... 정적 한글 세그먼트가 404를 반환
  // (라우트 파일은 존재: src/app/(frontend)/hospitals/역/[line]/[station]/page.tsx).
  // sitemap에 역 URL이 포함되므로 프로덕션 크롤에도 영향 — 수정 후 fixme 해제.
  test.fixme("역 페이지(/hospitals/역/2호선/강남역)가 렌더된다", async ({ page }) => {
    const res = await page.goto("/hospitals/역/2호선/강남역");
    expect(res?.status()).toBe(200);
    await expect(page.getByText("강남역").first()).toBeVisible();
    await expect(page).toHaveTitle(/강남역/);
  });

  test("존재하지 않는 역은 404를 반환한다", async ({ request }) => {
    const res = await request.get("/hospitals/역/99호선/없는역");
    expect(res.status()).toBe(404);
  });
});
