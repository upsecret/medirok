// 병원 소식(/blog)을 여러 지점에 걸쳐 하나로 묶는 그룹 정의.
//
// 블로그 글은 `hospital` 관계로 실제 지점 1곳에 귀속된다(관련 의원 카드·JSON-LD 작성 주체가
// 사실과 맞도록). 그런데 네트워크 병원은 병원 소식을 지점별로 쪼개지 않고 한 브랜드로 보여야 한다.
//
// "힐하우스피부과" 같은 병원 문서를 하나 더 만드는 방식은 쓰지 않는다 — 병원 문서엔 숨김 필드가 없고
// 주소·지역·진료과가 필수라, 병원 찾기·지역 페이지·sitemap에 실재하지 않는 지점으로 노출된다.
// 그래서 URL 1단계와 목록 묶음만 여기서 그룹 단위로 푼다(스키마 변경 없음).
//
// 새 네트워크 고객은 여기에 한 항목을 더한다. 그룹 slug는 어떤 병원 slug와도 겹치면 안 된다
// (e2e/blog.spec.ts가 검사한다).

export interface BlogGroup {
  /** URL 1단계 — /blog/<slug> */
  slug: string;
  nameKr: string;
  shortDescription: string;
  /** 묶이는 실제 병원(지점) slug */
  hospitalSlugs: string[];
  /** 로고·커버를 빌려올 지점 */
  representativeSlug: string;
}

export const BLOG_GROUPS: BlogGroup[] = [
  {
    slug: "힐하우스피부과",
    nameKr: "힐하우스피부과",
    shortDescription:
      "강남·건대·판교·수원·대구 5개 지점 · 피부과 전문의가 진단부터 시술까지 직접 진료",
    hospitalSlugs: [
      "힐하우스피부과강남점",
      "힐하우스피부과건대점",
      "힐하우스피부과판교점",
      "힐하우스피부과수원점",
      "힐하우스피부과대구점",
    ],
    // 로고는 5개 지점이 같은 파일이라 어느 지점이든 같다. 커버는 강남점(대표 소재지) 것을 쓴다.
    representativeSlug: "힐하우스피부과강남점",
  },
];

export function blogGroupBySlug(slug: string): BlogGroup | undefined {
  return BLOG_GROUPS.find((g) => g.slug === slug);
}

export function blogGroupOfHospital(hospitalSlug: string): BlogGroup | undefined {
  return BLOG_GROUPS.find((g) => g.hospitalSlugs.includes(hospitalSlug));
}

/** 병원 소식에서 이 병원의 글이 노출되는 URL 1단계 — 그룹에 속하면 그룹 slug, 아니면 자기 slug */
export function blogOwnerSlug(hospitalSlug: string): string {
  return blogGroupOfHospital(hospitalSlug)?.slug ?? hospitalSlug;
}
