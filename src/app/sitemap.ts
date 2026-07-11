import type { MetadataRoute } from "next";
import {
  getAllHospitals,
  getAllRegions,
  getAllDepartments,
} from "@/lib/hospitals-data";
import { getAllMagazines } from "@/lib/magazines-data";
import { SUBWAY_LINES } from "@/lib/stations";
import { SITE_URL } from "@/lib/site";

// 매거진 카테고리(매거진/category/[cat]) — CAT_LABELS와 동일.
const MAGAZINE_CATEGORIES = ["article", "regional", "interview", "case"];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hospitals, regions, departments, magazines] = await Promise.all([
    getAllHospitals(),
    getAllRegions(),
    getAllDepartments(),
    getAllMagazines(),
  ]);
  // 진료과 slug(영문) → URL 세그먼트(한국어 nameKr)
  const deptNameBySlug = new Map(departments.map((d) => [d.slug, d.nameKr]));

  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  // 정적 페이지
  const staticEntries: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/hospitals"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/magazine"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: url("/estimate"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/verification"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // 매거진 카테고리
  const categoryEntries: MetadataRoute.Sitemap = MAGAZINE_CATEGORIES.map((cat) => ({
    url: url(`/magazine/category/${cat}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 매거진 글
  const magazineEntries: MetadataRoute.Sitemap = magazines.map((m) => ({
    url: url(`/magazine/${m.slug}`),
    lastModified: m.publishedAt ? new Date(m.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 의원 상세
  const hospitalEntries: MetadataRoute.Sitemap = hospitals.map((h) => ({
    url: url(`/hospital/${h.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 지역 슬러그 → 상위 시도 슬러그 매핑
  const regionBySlug = new Map(regions.map((r) => [r.slug, r]));

  // 시도 페이지: /hospitals/[sido]
  const sidoEntries: MetadataRoute.Sitemap = regions
    .filter((r) => r.level === "sido")
    .map((r) => ({
      url: url(`/hospitals/${r.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // 시군구 페이지: /hospitals/[sido]/[gu]
  const guEntries: MetadataRoute.Sitemap = regions
    .filter((r) => r.level === "sigungu" && r.parentSlug)
    .map((r) => ({
      url: url(`/hospitals/${r.parentSlug}/${r.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // 지역×진료과 페이지: /hospitals/[sido]/[gu]/[dept] — 실제 병원이 있는 조합만
  const deptCombos = new Set<string>();
  const deptEntries: MetadataRoute.Sitemap = [];
  for (const h of hospitals) {
    const gu = regionBySlug.get(h.regionSlug);
    const sido = h.sidoSlug ?? gu?.parentSlug;
    const deptName = deptNameBySlug.get(h.departmentSlug);
    if (!gu || !sido || !deptName) continue;
    const key = `${sido}/${gu.slug}/${deptName}`;
    if (deptCombos.has(key)) continue;
    deptCombos.add(key);
    deptEntries.push({
      url: url(`/hospitals/${key}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // 역주변 페이지: /hospitals/역/[line]/[station] — 실제 병원이 있는 역만
  const stationLineSlug = new Map<string, string>();
  for (const l of SUBWAY_LINES) {
    for (const s of l.stations) {
      if (!stationLineSlug.has(s.name)) stationLineSlug.set(s.name, l.lineSlug);
    }
  }
  const stationSeen = new Set<string>();
  const stationEntries: MetadataRoute.Sitemap = [];
  for (const h of hospitals) {
    const st = h.nearestStationName;
    const lineSlug = st ? stationLineSlug.get(st) : undefined;
    if (!st || !lineSlug || stationSeen.has(st)) continue;
    stationSeen.add(st);
    stationEntries.push({
      url: url(`/hospitals/역/${lineSlug}/${st}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...magazineEntries,
    ...hospitalEntries,
    ...sidoEntries,
    ...guEntries,
    ...deptEntries,
    ...stationEntries,
  ];
}
