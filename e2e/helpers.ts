import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────
// 테스트 상태 (setup 프로젝트가 기록한 시드 데이터 픽스처)
// ─────────────────────────────────────────────────────────────

export interface E2EState {
  hospitalCount: number;
  hospitalSlug: string | null;
  magazineCount: number;
  magazineSlug: string | null;
  magazine: {
    hasShortAnswer: boolean;
    hasFaq: boolean;
    category: string | null;
    type: string | null;
  } | null;
  /** 지역 SEO 경로 샘플 — /hospitals/[sido]/[gu]/[dept] (실제 병원이 있는 조합) */
  region: {
    sido: string;
    gu: string;
    dept: string;
    sidoName: string;
    guName: string;
  } | null;
  /**
   * slug→FK 전환으로 생긴 관계 교차링크 픽스처.
   * 해당 관계 데이터가 있을 때만 채워지고, 없으면 각 필드가 null → 테스트 skip.
   */
  crossLinks: {
    /** authorDoctor가 실제 의사 문서로 해석되는 매거진 slug (저자 프로필 cross-link 테스트) */
    authorMagazineSlug: string | null;
    /** 위 매거진 저자 의사의 이름 (렌더 검증용) */
    authorDoctorName: string | null;
    /** 위 저자 의사의 소속 의원 slug (저자→의원 링크 href 검증용) */
    authorHospitalSlug: string | null;
    /** linkedHospitals 관계가 1건 이상인 매거진 slug ("관련 메디록 의원" 카드 테스트) */
    linkedHospitalsMagazineSlug: string | null;
    /** 소속 의사가 매거진을 1편 이상 쓴 의원 slug ("의료진이 직접 쓴 글" 테스트) */
    hospitalWithAuthoredMagsSlug: string | null;
  };
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(HERE, ".state.json");

/** setup 프로젝트가 기록한 픽스처를 읽는다. 없으면 빈 상태 반환. */
export function loadState(): E2EState {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")) as E2EState;
  } catch {
    return {
      hospitalCount: 0,
      hospitalSlug: null,
      magazineCount: 0,
      magazineSlug: null,
      magazine: null,
      region: null,
      crossLinks: {
        authorMagazineSlug: null,
        authorDoctorName: null,
        authorHospitalSlug: null,
        linkedHospitalsMagazineSlug: null,
        hospitalWithAuthoredMagsSlug: null,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// UI 헬퍼
// ─────────────────────────────────────────────────────────────

/** 병원찾기 페이지에서 醫錄 인증 병원 수를 파싱한다. */
export async function getHospitalCount(page: Page): Promise<number> {
  await page.goto("/hospitals");
  const counter = page.getByText(/醫錄 인증 병원 \d+곳/);
  await expect(counter).toBeVisible();
  const text = await counter.textContent();
  const match = text?.match(/(\d+)곳/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

// ─────────────────────────────────────────────────────────────
// SEO 헬퍼 (JSON-LD · meta)
// ─────────────────────────────────────────────────────────────

type Schema = Record<string, unknown>;

/** 페이지의 모든 JSON-LD 블록을 파싱해 평탄화된 배열로 반환한다. */
export async function getJsonLdSchemas(page: Page): Promise<Schema[]> {
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const schemas: Schema[] = [];
  for (const text of raw) {
    const parsed = JSON.parse(text) as Schema | Schema[];
    if (Array.isArray(parsed)) schemas.push(...parsed);
    else schemas.push(parsed);
  }
  return schemas;
}

/** 특정 @type의 JSON-LD 스키마가 존재하는지 검증하고 반환한다. */
export async function expectJsonLdType(page: Page, type: string): Promise<Schema> {
  const schemas = await getJsonLdSchemas(page);
  const found = schemas.find((s) => s["@type"] === type);
  expect(
    found,
    `JSON-LD @type="${type}" 스키마가 있어야 합니다 (발견: ${schemas
      .map((s) => s["@type"])
      .join(", ")})`
  ).toBeTruthy();
  return found!;
}

/** canonical link가 기대 경로를 가리키는지 검증한다. */
export async function expectCanonical(page: Page, pathname: string | RegExp): Promise<void> {
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(href, "canonical link가 있어야 합니다").toBeTruthy();
  const decoded = decodeURIComponent(href!);
  if (typeof pathname === "string") {
    expect(decoded.endsWith(pathname), `canonical(${decoded})이 ${pathname}로 끝나야 합니다`).toBe(
      true
    );
  } else {
    expect(decoded).toMatch(pathname);
  }
}

/** meta[name=...] content를 반환한다 (없으면 null). */
export async function metaContent(page: Page, name: string): Promise<string | null> {
  const meta = page.locator(`meta[name="${name}"]`);
  if ((await meta.count()) === 0) return null;
  return meta.first().getAttribute("content");
}

/** og: 메타 태그 content를 반환한다 (없으면 null). */
export async function ogContent(page: Page, property: string): Promise<string | null> {
  const meta = page.locator(`meta[property="og:${property}"]`);
  if ((await meta.count()) === 0) return null;
  return meta.first().getAttribute("content");
}
