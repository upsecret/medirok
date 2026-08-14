import type { MetadataRoute } from "next";
import { getAllHospitals } from "@/lib/hospitals-data";
import { getAllMagazines } from "@/lib/magazines-data";
import { getAllBlogPosts } from "@/lib/blog-data";
import {
  getRegionRouteParams,
  getStationRouteParams,
} from "@/lib/route-params";
import { SITE_URL } from "@/lib/site";

// 매거진 카테고리(매거진/category/[cat]) — CAT_LABELS와 동일.
const MAGAZINE_CATEGORIES = ["article", "regional", "interview", "case"];

// 시드가 즉시 라이브라 매번 재생성하던 것을 캐시로 바꿨다.
// 발행 직후 반영은 /revalidate 엔드포인트가 담당한다(scripts/revalidate.ts).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hospitals, magazines, blogPosts, regionParams, stationParams] =
    await Promise.all([
      getAllHospitals(),
      getAllMagazines(),
      getAllBlogPosts(),
      // 프리렌더 대상과 동일한 계산 — 갈라지지 않도록 한 곳에서 가져온다
      getRegionRouteParams(),
      getStationRouteParams(),
    ]);

  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  // 정적 페이지
  const staticEntries: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/hospitals"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/magazine"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: url("/blog"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: url("/verification"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/verification/apply"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
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

  // 의원 블로그 — 병원별 목록 + 글 상세
  const blogHospitalSlugs = [
    ...new Set(blogPosts.map((p) => p.hospitalSlug).filter(Boolean)),
  ];
  const blogHospitalEntries: MetadataRoute.Sitemap = blogHospitalSlugs.map((slug) => ({
    url: url(`/blog/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const blogPostEntries: MetadataRoute.Sitemap = blogPosts
    .filter((p) => p.hospitalSlug)
    .map((p) => ({
      url: url(`/blog/${p.hospitalSlug}/${p.slug}`),
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
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

  // 시도 페이지: /hospitals/[sido]
  const sidoEntries: MetadataRoute.Sitemap = regionParams.sido.map((p) => ({
    url: url(`/hospitals/${p.sido}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 시군구 페이지: /hospitals/[sido]/[gu]
  const guEntries: MetadataRoute.Sitemap = regionParams.gu.map((p) => ({
    url: url(`/hospitals/${p.sido}/${p.gu}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // 지역×진료과 페이지: /hospitals/[sido]/[gu]/[dept] — 실제 병원이 있는 조합만
  const deptEntries: MetadataRoute.Sitemap = regionParams.regionDept.map((p) => ({
    url: url(`/hospitals/${p.sido}/${p.gu}/${p.dept}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 역주변 페이지: /hospitals/역/[line]/[station] — 실제 병원이 있는 역만
  const stationEntries: MetadataRoute.Sitemap = stationParams.map((p) => ({
    url: url(`/hospitals/역/${p.line}/${p.station}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...magazineEntries,
    ...blogHospitalEntries,
    ...blogPostEntries,
    ...hospitalEntries,
    ...sidoEntries,
    ...guEntries,
    ...deptEntries,
    ...stationEntries,
  ];
}
