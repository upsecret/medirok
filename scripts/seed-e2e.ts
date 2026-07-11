/**
 * e2e 전용 시드 — 로컬 Postgres(docker-compose.e2e.yml)에 결정적 픽스처 주입
 *
 * 실행:
 *   npm run e2e:seed
 *   (= node --env-file=.env.e2e --import tsx/esm scripts/seed-e2e.ts)
 *
 * - scripts/legacy-seed-data.ts(진료과·지역·병원) + legacy-seed-magazines.ts(매거진)를
 *   slug 기준 upsert — 여러 번 실행해도 안전
 * - 쓰기는 upsertWithRefs(M4)가 slug 표기를 관계(FK)로 변환해 수행
 * - 안전장치: DATABASE_URL이 로컬(localhost/127.0.0.1)이 아니면 즉시 중단
 *   (프로덕션 DB 오염 방지 — e2e는 절대 프로덕션에 시드하지 않는다)
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { seedDepartments, seedRegions, seedHospitals } from "./legacy-seed-data";
import { seedMagazines } from "./legacy-seed-magazines";
import { upsertWithRefs } from "./upsert-with-refs";

type AnyData = Record<string, unknown>;

function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  if (!isLocal) {
    console.error(
      "✗ 중단: DATABASE_URL이 로컬 DB가 아닙니다. e2e 시드는 로컬 Postgres에만 허용됩니다.\n" +
        "  npm run e2e:db:up 후 .env.e2e 환경으로 실행하세요."
    );
    process.exit(1);
  }
}

async function main() {
  assertLocalDatabase();
  const payload = await getPayload({ config });

  // 레거시 시드는 영문 지역 slug(seoul, gangnam…)를 쓰지만 운영 URL 체계는
  // 한국어 slug(서울, 강남구…)다 (scripts/migrate-korean-urls.ts 참고).
  // 운영과 동일한 체계로 변환해 주입한다: region.slug = nameKr, parentSlug = 상위 nameKr.
  const regionByEngSlug = new Map(seedRegions.map((r) => [r.slug, r]));
  const toKr = (engSlug?: string): string | undefined =>
    engSlug ? (regionByEngSlug.get(engSlug)?.nameKr ?? engSlug) : undefined;

  console.log(`• 진료과(departments) upsert — ${seedDepartments.length}건`);
  for (const d of seedDepartments) {
    await upsertWithRefs(payload, "departments", d.slug, d as unknown as AnyData);
  }

  console.log(`• 지역(regions) upsert — ${seedRegions.length}건 (한국어 slug로 변환)`);
  for (const r of seedRegions) {
    const data = { ...r, slug: r.nameKr, parentSlug: toKr(r.parentSlug) ?? "" };
    await upsertWithRefs(payload, "regions", data.slug, data as unknown as AnyData);
  }

  console.log(`• 병원(hospitals) upsert — ${seedHospitals.length}건 (지역 참조 한국어화)`);
  for (const h of seedHospitals) {
    const data = {
      ...h,
      regionSlug: toKr(h.regionSlug) ?? h.regionSlug,
      dongSlug: toKr(h.dongSlug),
    };
    await upsertWithRefs(payload, "hospitals", h.slug, data as unknown as AnyData);
  }

  console.log(`• 매거진(magazines) upsert — ${seedMagazines.length}건 (지역 참조 한국어화)`);
  for (const m of seedMagazines) {
    const data = { ...m, linkedRegionSlug: toKr(m.linkedRegionSlug) };
    await upsertWithRefs(payload, "magazines", m.slug, data as unknown as AnyData);
  }

  console.log("✓ e2e 시드 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
