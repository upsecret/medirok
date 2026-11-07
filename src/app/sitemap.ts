import type { MetadataRoute } from "next";
import { getAllHospitals } from "@/lib/hospitals-data";
import { getAllMagazines } from "@/lib/magazines-data";
import { getAllBlogPosts } from "@/lib/blog-data";
import { blogOwnerSlug } from "@/lib/blog-groups";
import {
  getRegionRouteParams,
  getStationRouteParams,
} from "@/lib/route-params";
import { SITE_URL } from "@/lib/site";

// 매거진 카테고리(매거진/category/[cat]) — CAT_LABELS와 동일.
const MAGAZINE_CATEGORIES = ["article", "regional", "interview", "case"];

// 시드가 즉시 라이브라 매번 재생성하던 것을 한때 ISR(revalidate = 3600)로 바꿨다.
// 그 구성은 운영에서 동작하지 않았다 — 2026-11-07 실측:
//
//   - 빌드 산출물에는 /sitemap.xml → initialRevalidateSeconds: 3600이 제대로 박힌다.
//   - 그런데 Vercel에서 그 ISR 엔트리가 재생성되지 않는다. 같은 POP에서 연달아 쳐도
//     age가 1796·2578·2999·3240·3873으로 널뛰며 전부 x-vercel-cache: HIT에 같은 내용이다.
//     age 3873 > 3600인데도 갱신되지 않았고, 요청에 Cache-Control/Pragma: no-cache를
//     붙여도 HIT였다.
//   - 함수에서 부른 revalidatePath("/sitemap.xml")도 그 엔트리에 닿지 않는다.
//     scripts/revalidate.ts는 "✓ 재검증 완료"를 찍고 사이트맵은 그대로였다.
//   - 결과적으로 사이트맵은 **배포 때만** 바뀌었다. 발행 절차가 커밋 → 배포 → 시드
//     순서라서, 매번 직전 배포 시점의 글 목록이 구워진 채 남는 구조적 한 발 뒤였다.
//     (실측: 글 27편인데 사이트맵은 직전 배포 시점의 25편)
//
// 그래서 프리렌더를 포기하고 신선도를 CDN TTL에 맡긴다. 캐시 계층 자체는 멀쩡히
// 동작하는 것을 위 age 관측으로 확인했으므로, 멈춰 있던 ISR 재생성을 빼고
// next.config.ts의 /sitemap.xml Cache-Control(s-maxage)로 상한을 건다.
// 크롤러만 받는 경로라 분당 DB 1회가 상한인 비용은 무시할 수준이다.
export const dynamic = "force-dynamic";

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

  // 의원 블로그 — 소유자(병원 또는 블로그 그룹)별 목록 + 글 상세.
  // 그룹에 묶인 지점은 지점 URL이 아니라 그룹 URL만 싣는다(지점 URL은 그룹으로 영구 이동한다).
  const blogHospitalSlugs = [
    ...new Set(blogPosts.map((p) => (p.hospitalSlug ? blogOwnerSlug(p.hospitalSlug) : "")).filter(Boolean)),
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
      url: url(`/blog/${blogOwnerSlug(p.hospitalSlug)}/${p.slug}`),
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
