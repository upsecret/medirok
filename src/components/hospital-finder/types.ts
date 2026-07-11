// 병원찾기 공용 타입·상수

export type SortKey = "recommended" | "rating" | "reviews" | "visitors";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "추천순" },
  { key: "rating", label: "평점 높은순" },
  { key: "reviews", label: "리뷰 많은순" },
  { key: "visitors", label: "방문 많은순" },
];

/** 지역 선택 결과 — 시도/구/동 중 가장 구체적인 단위만 채워짐 */
export interface RegionSelection {
  sido?: string;
  region?: string; // 시군구 slug
  dong?: string;
}
