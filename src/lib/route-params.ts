// 프리렌더 대상 경로의 단일 출처.
//
// sitemap과 generateStaticParams가 같은 계산을 쓰게 한다. 갈라지면
// "sitemap에는 있는데 프리렌더는 안 되는" 조합이 조용히 생기고, 그게 정확히
// 2026-08-14 이전 상태였다 — 4개 라우트가 revalidate만 선언하고
// generateStaticParams가 없어 ISR 항목이 아예 만들어지지 않았다.
//
// 세그먼트 값은 **디코드된 한국어**다. Next가 params를 인코딩해 넘겨주므로
// 페이지 쪽은 decodeParam()으로 되돌려 쓴다(hospitals-data.ts:37).

import { getAllHospitals, getAllRegions, getAllDepartments } from "@/lib/hospitals-data";
import { SUBWAY_LINES } from "@/lib/stations";

export interface RegionDeptCombo {
  sido: string;
  gu: string;
  /** 진료과 URL 세그먼트 = departments.nameKr (예: "치과") */
  dept: string;
}

/** 시도 / 시군구 / 지역×진료과 조합을 한 번에 산출 (조회 3회를 공유) */
export async function getRegionRouteParams(): Promise<{
  sido: { sido: string }[];
  gu: { sido: string; gu: string }[];
  regionDept: RegionDeptCombo[];
}> {
  const [hospitals, regions, departments] = await Promise.all([
    getAllHospitals(),
    getAllRegions(),
    getAllDepartments(),
  ]);

  const deptNameBySlug = new Map(departments.map((d) => [d.slug, d.nameKr]));
  const regionBySlug = new Map(regions.map((r) => [r.slug, r]));

  const sido = regions
    .filter((r) => r.level === "sido")
    .map((r) => ({ sido: r.slug }));

  const gu = regions
    .filter((r) => r.level === "sigungu" && r.parentSlug)
    .map((r) => ({ sido: r.parentSlug as string, gu: r.slug }));

  // 실제 병원이 있는 조합만 — 빈 페이지를 프리렌더할 이유가 없다
  const seen = new Set<string>();
  const regionDept: RegionDeptCombo[] = [];
  for (const h of hospitals) {
    const guRegion = regionBySlug.get(h.regionSlug);
    const sidoSlug = h.sidoSlug ?? guRegion?.parentSlug;
    const dept = deptNameBySlug.get(h.departmentSlug);
    if (!guRegion || !sidoSlug || !dept) continue;
    const key = `${sidoSlug}/${guRegion.slug}/${dept}`;
    if (seen.has(key)) continue;
    seen.add(key);
    regionDept.push({ sido: sidoSlug, gu: guRegion.slug, dept });
  }

  return { sido, gu, regionDept };
}

/** 의원 상세 */
export async function getHospitalRouteParams(): Promise<{ slug: string }[]> {
  const hospitals = await getAllHospitals();
  return hospitals.map((h) => ({ slug: h.slug }));
}

/** 역주변 — 실제 병원이 있는 역만 */
export async function getStationRouteParams(): Promise<
  { line: string; station: string }[]
> {
  const hospitals = await getAllHospitals();
  const lineByStation = new Map<string, string>();
  for (const l of SUBWAY_LINES) {
    for (const s of l.stations) {
      if (!lineByStation.has(s.name)) lineByStation.set(s.name, l.lineSlug);
    }
  }
  const seen = new Set<string>();
  const out: { line: string; station: string }[] = [];
  for (const h of hospitals) {
    const st = h.nearestStationName;
    const line = st ? lineByStation.get(st) : undefined;
    if (!st || !line || seen.has(st)) continue;
    seen.add(st);
    out.push({ line, station: st });
  }
  return out;
}
