import { test, expect } from "@playwright/test";
import { loadState, expectJsonLdType, expectCanonical } from "./helpers";

const state = loadState();
const noHospitals = state.hospitalCount === 0;

test.describe("병원찾기", () => {
  test("필터 칩바와 결과 카운터가 표시된다", async ({ page }) => {
    await page.goto("/hospitals");

    await expect(page.getByText("홈 › 병원 찾기")).toBeVisible();
    await expect(page.getByRole("button", { name: "지역" })).toBeVisible();
    await expect(page.getByRole("button", { name: "진료과" })).toBeVisible();
    await expect(page.getByRole("button", { name: "추천순" })).toBeVisible();
    await expect(page.getByText(/조건에 맞는 병원 \d+곳/)).toBeVisible();
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
      page.getByText("선택한 조건에 맞는 병원이 아직 없습니다.")
    ).toBeVisible();
  });

  test("퀵뷰에서 병원 상세 페이지로 이동한다", async ({ page }) => {
    test.skip(noHospitals, "Payload DB에 병원 데이터가 없습니다");
    await page.goto("/hospitals");

    await page.getByRole("button", { name: "빠른 보기" }).first().click();

    const quickView = page.getByRole("dialog");
    await expect(quickView).toBeVisible();
    await quickView.getByRole("link", { name: "자세히 보기" }).click();

    await expect(page).toHaveURL(/\/hospital\/.+/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("병원 상세", () => {
  const slug = state.hospitalSlug;
  const zeroSlug = state.hospitalWithoutReviewsSlug;

  test("slug 페이지가 200을 반환하고 핵심 섹션이 렌더된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");

    const response = await page.goto(`/hospital/${slug}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator("h1").first()).toBeVisible();
    // 핵심 섹션: 진료/가격 · 의료진 · 실방문 후기 · 위치/진료시간
    await expect(page.getByRole("heading", { name: "진료 · 가격 정보" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /의료진 \(\d+명\)/ })).toBeVisible();
    // 메디록 검증 후기가 없는 병원은 "방문 후기 발췌 (n)"으로 그려진다 (출처 표기형)
    await expect(
      page.getByRole("heading", { name: /(실방문 후기|방문 후기 발췌) \(\d+\)/ })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "위치 · 진료시간" })).toBeVisible();
  });

  test("4단계 인증 박스가 표시된다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    await expect(page.getByText("이 병원에서 확인한 4가지 기준").first()).toBeVisible();
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

  // ── 후기 표기 (2026-10-31) ──
  // 메디록 검증 후기(영수증·휴대폰)는 아직 0건이고 실려 있는 것은 전부 공개 플랫폼 발췌다.
  // "실방문 후기"라는 제목과 reviewCount 숫자가 그 사실과 어긋나 있었다.
  test("외부 발췌 후기는 출처를 표기하고 숫자가 카드 수와 일치한다", async ({ page }) => {
    test.skip(!slug, "Payload DB에 병원 데이터가 없습니다");
    await page.goto(`/hospital/${slug}`);

    const heading = page.getByRole("heading", { name: /(실방문 후기|방문 후기 발췌) \(\d+\)/ });
    await expect(heading).toBeVisible();
    const shown = Number((await heading.innerText()).match(/\((\d+)\)/)![1]);

    const isExcerpt = (await heading.innerText()).includes("발췌");
    if (isExcerpt) {
      await expect(page.getByText("VERIFIED REVIEWS")).toHaveCount(0);
      await expect(page.getByText(/구글맵|네이버|외부 플랫폼/).first()).toBeVisible();
      // 제목 숫자는 화면에 실제로 그려진 카드 수여야 한다 (예전엔 공개 집계 114를 띄우고 3장을 그렸다)
      const cards = page.locator("section").filter({ has: heading }).locator("div.rounded-xl");
      expect(shown, "제목 숫자가 렌더된 후기 카드 수와 같아야 합니다").toBe(await cards.count());
    }
  });

  test("후기 0건 병원: ★ 0이 아니라 수집 상태를 말한다", async ({ page }) => {
    test.skip(!zeroSlug, "후기가 비어 있는 병원이 없습니다");
    await page.goto(`/hospital/${zeroSlug}`);

    await expect(page.getByText(/★\s*0(?!\d)/)).toHaveCount(0);
    await expect(page.getByText(/후기\s*0\s*개/)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "후기 수집 상태" })).toBeVisible();
    await expect(page.getByRole("link", { name: "지도에서 공개 후기 확인" })).toBeVisible();
  });

  test("후기 0건 병원: MedicalOrganization에 aggregateRating이 없다", async ({ page }) => {
    test.skip(!zeroSlug, "후기가 비어 있는 병원이 없습니다");
    await page.goto(`/hospital/${zeroSlug}`);

    const org = await expectJsonLdType(page, "MedicalOrganization");
    expect(
      org.aggregateRating,
      "제3자 플랫폼 평점을 자사 aggregateRating으로 선언하지 않는다 (런북 §11-5)"
    ).toBeUndefined();
  });

  test("병원찾기 목록에 ★ 0이 노출되지 않는다", async ({ page }) => {
    await page.goto("/hospitals");
    await expect(page.getByText(/★\s*0(?!\d)/)).toHaveCount(0);
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
  // 여기에 linkedHospitals 기반 글(getMagazinesByHospital)이 합쳐져 한 섹션으로 노출된다.
  test('의원 cross-link: "관련 메디록 매거진" 섹션이 매거진으로 연결된다', async ({
    page,
  }) => {
    const hSlug = state.crossLinks.hospitalWithAuthoredMagsSlug;
    test.skip(!hSlug, "소속 의사가 매거진을 쓴 의원이 없습니다");
    await page.goto(`/hospital/${hSlug}`);

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /관련 메디록 매거진/ }),
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
