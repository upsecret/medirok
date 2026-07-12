/**
 * 한국어 URL 마이그레이션 — 멱등(idempotent)
 *
 * 실행:
 *   node --env-file=.env.local --import tsx scripts/migrate-korean-urls.ts
 *
 * 변환 내용:
 *  - regions.slug → nameKr (예: incheon→인천, gangnam→강남구, yeoksam→역삼동)
 *    parentSlug 도 상위 region의 nameKr로 재매핑(시/도 기준 스코프).
 *  - hospitals: sidoSlug(시/도 nameKr) 채움, regionSlug→구 nameKr, dongSlug→동 nameKr,
 *    slug → 병원명(nameKr, 공백→하이픈). departmentSlug(영문)는 유지.
 *
 * 멱등: nameKr 기반으로 목표 상태를 계산하므로 여러 번 실행해도 동일 결과.
 *
 * ⚠️ regions.slug 는 현재 unique 제약이 있습니다. 같은 구 이름(예: 부산 서구)을
 *    추가하려면 먼저 Regions 컬렉션 slug의 unique 제약을 풀어야 합니다.
 */

import { getSeedPayload } from "./seed-payload";

const slugify = (s: string) => s.trim().replace(/\s+/g, "-");

async function main() {
  const payload = await getSeedPayload();

  // ── 1) regions 로드 + 현재 slug 기준 맵 ──────────────────────────
  const regionsRes = await payload.find({ collection: "regions", limit: 1000, depth: 0 });
  const regions = regionsRes.docs as any[];
  const byCurrentSlug = new Map<string, any>(regions.map((r) => [r.slug, r]));

  // 상위 region 해석(현재 parentSlug 기준 — 영문이든 한국어든)
  const resolveParent = (parentSlug?: string): any | undefined =>
    parentSlug ? byCurrentSlug.get(parentSlug) : undefined;

  // 각 region의 목표 상태 + 조상 nameKr 계산(쓰기 전에 일괄 산출)
  type Plan = { id: any; newSlug: string; newParentSlug: string; sidoKr?: string; guKr?: string };
  const plans: Plan[] = [];
  const ancestryByCurrentSlug = new Map<string, { sidoKr?: string; guKr?: string }>();

  for (const r of regions) {
    let newParentSlug = "";
    let sidoKr: string | undefined;
    let guKr: string | undefined;

    if (r.level === "sido") {
      sidoKr = r.nameKr;
    } else if (r.level === "sigungu") {
      const sido = resolveParent(r.parentSlug);
      sidoKr = sido?.nameKr;
      guKr = r.nameKr;
      newParentSlug = sido?.nameKr ?? "";
    } else if (r.level === "dong") {
      const gu = resolveParent(r.parentSlug);
      const sido = gu ? resolveParent(gu.parentSlug) : undefined;
      sidoKr = sido?.nameKr;
      guKr = gu?.nameKr;
      newParentSlug = gu?.nameKr ?? "";
    }

    plans.push({ id: r.id, newSlug: r.nameKr, newParentSlug, sidoKr, guKr });
    ancestryByCurrentSlug.set(r.slug, { sidoKr, guKr });
  }

  // ── 2) regions 업데이트 ────────────────────────────────────────
  console.log("• regions 업데이트");
  for (const p of plans) {
    await payload.update({
      collection: "regions",
      id: p.id,
      data: { slug: p.newSlug, parentSlug: p.newParentSlug },
    });
  }
  console.log(`  ✓ ${plans.length}개 region`);

  // ── 3) hospitals 업데이트 ──────────────────────────────────────
  const hospRes = await payload.find({ collection: "hospitals", limit: 1000, depth: 0 });
  const hospitals = hospRes.docs as any[];
  console.log("• hospitals 업데이트");
  for (const h of hospitals) {
    // 현재(구) regionSlug로 구 region 해석 → 시/도·구 nameKr
    const guRegion = byCurrentSlug.get(h.regionSlug);
    const sido = guRegion ? resolveParent(guRegion.parentSlug) : undefined;
    const sidoKr = sido?.nameKr ?? h.sidoSlug ?? "";
    const guKr = guRegion?.nameKr ?? h.regionSlug;
    const dongRegion = h.dongSlug ? byCurrentSlug.get(h.dongSlug) : undefined;
    const dongKr = dongRegion?.nameKr ?? h.dongSlug ?? undefined;

    const data: Record<string, unknown> = {
      sidoSlug: sidoKr,
      regionSlug: guKr,
      slug: slugify(h.nameKr),
    };
    if (dongKr) data.dongSlug = dongKr;

    await payload.update({ collection: "hospitals", id: h.id, data });
    console.log(`  ✓ ${h.nameKr} → /hospital/${slugify(h.nameKr)}  (${sidoKr}/${guKr}${dongKr ? "/" + dongKr : ""})`);
  }

  console.log("\n✅ 한국어 URL 마이그레이션 완료");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ 마이그레이션 실패:", e);
  process.exit(1);
});
