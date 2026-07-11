"use client";

// 병원찾기 필터 훅 — 필터/정렬 상태 + 파생 결과 + URL 동기화

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { Hospital, Region, Department } from "@/types";
import { SORT_OPTIONS, type SortKey } from "./types";

interface UseHospitalFiltersArgs {
  hospitals: Hospital[];
  regions: Region[];
  departments: Department[];
  initialSido?: string;
  initialRegion?: string;
  initialDong?: string;
  initialDept?: string;
  initialSort?: string;
  initialLine?: string;
  initialStation?: string;
}

export function useHospitalFilters({
  hospitals,
  regions,
  departments,
  initialSido,
  initialRegion,
  initialDong,
  initialDept,
  initialSort,
  initialLine,
  initialStation,
}: UseHospitalFiltersArgs) {
  const router = useRouter();

  // dept URL 파라미터는 한국어(nameKr, 예: "치과")로 노출하되 내부 상태/필터는 slug(dental) 유지.
  // URL에서 들어온 값이 한국어든 slug든 slug로 정규화.
  const normalizeDept = (v?: string): string | undefined => {
    if (!v) return undefined;
    if (departments.some((d) => d.slug === v)) return v;
    const byName = departments.find((d) => d.nameKr === v);
    return byName ? byName.slug : v;
  };

  const [sido, setSido] = useState<string | undefined>(initialSido);
  const [region, setRegion] = useState<string | undefined>(initialRegion);
  const [dong, setDong] = useState<string | undefined>(initialDong);
  // 역주변 필터 (지역 필터와 상호배타): line=노선 slug, station=역 slug(=역명)
  const [line, setLine] = useState<string | undefined>(initialLine);
  const [station, setStation] = useState<string | undefined>(initialStation);
  const [dept, setDept] = useState<string | undefined>(() => normalizeDept(initialDept));
  const [sort, setSort] = useState<SortKey>(
    SORT_OPTIONS.find((s) => s.key === initialSort)?.key ?? "recommended"
  );

  // ── 룩업 맵 ──────────────────────────────
  const deptMap = useMemo(
    () => new Map<string, string>(departments.map((d) => [d.slug, d.nameKr])),
    [departments]
  );
  const regionMap = useMemo(
    () => new Map(regions.map((r) => [r.slug, r])),
    [regions]
  );
  // 시군구 slug → 시도 slug (시도 단위 필터용)
  const guToSido = useMemo(
    () =>
      new Map<string, string>(
        regions
          .filter((r) => r.level === "sigungu" && r.parentSlug)
          .map((r) => [r.slug, r.parentSlug as string])
      ),
    [regions]
  );

  // ── URL 동기화 (공유·SEO용, 초기 렌더 제외) ──
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (sido) params.set("sido", sido);
    if (region) params.set("region", region);
    if (dong) params.set("dong", dong);
    if (line) params.set("line", line);
    if (station) params.set("station", station);
    if (dept) params.set("dept", deptMap.get(dept) ?? dept); // URL엔 한국어 진료과명
    if (sort !== "recommended") params.set("sort", sort);
    const qs = params.toString();
    const url = (qs ? `/hospitals?${qs}` : "/hospitals") as Route;
    router.replace(url, { scroll: false });
  }, [sido, region, dong, line, station, dept, sort, router]);

  // ── 필터 + 정렬 ──────────────────────────
  const results = useMemo(() => {
    let list = hospitals;
    // 역주변 필터(우선) — 지역 필터와 상호배타
    if (station) {
      list = list.filter((h) => h.nearestStationName === station);
    } else if (dong) list = list.filter((h) => h.dongSlug === dong);
    else if (region) list = list.filter((h) => h.regionSlug === region);
    else if (sido)
      list = list.filter((h) => guToSido.get(h.regionSlug) === sido);
    if (dept) list = list.filter((h) => h.departmentSlug === dept);

    const tierRank = (t: Hospital["tier"]) =>
      t === "HERITAGE" ? 0 : t === "PREMIUM" ? 1 : 2;

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        case "reviews":
          return b.reviewCount - a.reviewCount;
        case "visitors":
          return (b.monthlyVisitors ?? 0) - (a.monthlyVisitors ?? 0);
        default: // recommended
          return tierRank(a.tier) - tierRank(b.tier) || b.rating - a.rating;
      }
    });
    return sorted;
  }, [hospitals, sido, region, dong, station, dept, guToSido, sort]);

  return {
    sido,
    setSido,
    region,
    setRegion,
    dong,
    setDong,
    line,
    setLine,
    station,
    setStation,
    dept,
    setDept,
    sort,
    setSort,
    deptMap,
    regionMap,
    results,
  };
}
