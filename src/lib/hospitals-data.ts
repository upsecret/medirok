// 의원·진료과·지역 런타임 데이터 액세스 — Payload 백엔드
// 서버 컴포넌트/메타데이터/generateStaticParams에서 사용.
// Payload 도큐먼트를 프론트엔드 flat 타입(Hospital/Department/Region)으로 매핑.
// React cache로 요청 단위 중복 쿼리 제거.

import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";
import type {
  Hospital,
  Doctor,
  Department,
  Region,
  RegionLevel,
  PriceRange,
  Review,
  HospitalTier,
  DepartmentSlug,
  MedirokCertification,
  CurationNote,
} from "@/types";

type Raw = Record<string, unknown>;

/**
 * Next.js 동적 라우트 파라미터(params)는 한국어 등 비ASCII 세그먼트를
 * URL 인코딩된 채로 전달한다(예: "예온치과병원" → "%EC%98%88...").
 * slug는 디코드된 한국어로 저장되므로, 비교/링크 생성 전에 한 번 디코드한다.
 * 이미 디코드된 문자열에 적용해도(퍼센트 없음) 안전한 멱등 연산.
 */
export function decodeParam(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const optStr = (v: unknown): string | undefined => {
  const s = str(v).trim();
  return s || undefined;
};
const num = (v: unknown, d = 0): number => (typeof v === "number" ? v : Number(v) || d);
const optNum = (v: unknown): number | undefined =>
  typeof v === "number" ? v : v == null || v === "" ? undefined : Number(v);
const strArr = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const a = v.map(str).filter(Boolean);
  return a.length ? a : undefined;
};

function mapDoctor(d: Raw): Doctor {
  return {
    slug: str(d.slug),
    nameKr: str(d.nameKr),
    nameHanja: optStr(d.nameHanja),
    title: str(d.title),
    yearsExperience: num(d.yearsExperience),
    specialty: optStr(d.specialty),
    credentials: strArr(d.credentials),
  };
}

function mapPrice(p: Raw): PriceRange {
  return {
    treatmentName: str(p.treatmentName),
    treatmentNote: optStr(p.treatmentNote),
    normalLow: num(p.normalLow),
    normalHigh: num(p.normalHigh),
    eventLow: optNum(p.eventLow),
    eventHigh: optNum(p.eventHigh),
    insuranceNote: optStr(p.insuranceNote),
  };
}

function mapReview(r: Raw): Review {
  return {
    id: str(r.id),
    rating: num(r.rating),
    content: str(r.content),
    reviewerName: str(r.reviewerName),
    visitedAt: str(r.visitedAt),
    treatmentName: optStr(r.treatmentName),
    ageGroup: optStr(r.ageGroup),
    isReceiptVerified: Boolean(r.isReceiptVerified),
    isPhoneVerified: Boolean(r.isPhoneVerified),
  };
}

function mapCertification(c: unknown): MedirokCertification | undefined {
  if (!c || typeof c !== "object") return undefined;
  const g = c as Raw;
  const hasContent =
    optStr(g.stage1Detail) ||
    optStr(g.stage2Detail) ||
    optStr(g.stage3Detail) ||
    optStr(g.stage4Detail) ||
    optStr(g.certifiedAt);
  if (!hasContent) return undefined;
  return {
    stage1History: Boolean(g.stage1History),
    stage1Detail: str(g.stage1Detail),
    stage2Reviews: Boolean(g.stage2Reviews),
    stage2Detail: str(g.stage2Detail),
    stage3Credentials: Boolean(g.stage3Credentials),
    stage3Detail: str(g.stage3Detail),
    stage4Facility: Boolean(g.stage4Facility),
    stage4Detail: str(g.stage4Detail),
    certifiedAt: str(g.certifiedAt),
  };
}

function mapCurationNote(c: unknown): CurationNote | undefined {
  if (!c || typeof c !== "object") return undefined;
  const g = c as Raw;
  const text = optStr(g.text);
  if (!text) return undefined;
  return { text, curatorName: str(g.curatorName), curatorTitle: optStr(g.curatorTitle) };
}

function mapHours(h: unknown): Hospital["hours"] {
  if (!h || typeof h !== "object") return undefined;
  const g = h as Raw;
  const weekday = optStr(g.weekday);
  if (!weekday) return undefined;
  return {
    weekday,
    saturday: optStr(g.saturday),
    sunday: optStr(g.sunday),
    lunch: optStr(g.lunch),
  };
}

function mapHospital(doc: Raw): Hospital {
  return {
    slug: str(doc.slug),
    nameKr: str(doc.nameKr),
    shortDescription: optStr(doc.shortDescription),
    departmentSlug: str(doc.departmentSlug) as DepartmentSlug,
    sidoSlug: optStr(doc.sidoSlug),
    regionSlug: str(doc.regionSlug),
    dongSlug: optStr(doc.dongSlug),
    addressLine: str(doc.addressLine),
    nearestStation: optStr(doc.nearestStation),
    nearestStationName: optStr(doc.nearestStationName),
    walkingMinutes: optNum(doc.walkingMinutes),
    rating: num(doc.rating),
    reviewCount: num(doc.reviewCount),
    yearEstablished: optNum(doc.yearEstablished),
    doctorCount: num(doc.doctorCount),
    monthlyVisitors: optNum(doc.monthlyVisitors),
    tier: str(doc.tier) as HospitalTier,
    tags: strArr(doc.tags),
    certification: mapCertification(doc.certification),
    curationNote: mapCurationNote(doc.curationNote),
    doctors: Array.isArray(doc.doctors) ? (doc.doctors as Raw[]).map(mapDoctor) : [],
    prices: Array.isArray(doc.prices) ? (doc.prices as Raw[]).map(mapPrice) : [],
    reviews: Array.isArray(doc.reviews) ? (doc.reviews as Raw[]).map(mapReview) : [],
    phone: optStr(doc.phone),
    hours: mapHours(doc.hours),
  };
}

function mapDepartment(d: Raw): Department {
  return {
    slug: str(d.slug) as DepartmentSlug,
    nameKr: str(d.nameKr),
    nameEn: str(d.nameEn),
    nameJp: optStr(d.nameJp),
    hanja: str(d.hanja),
    description: str(d.description),
    priority: num(d.priority),
  };
}

function mapRegion(r: Raw): Region {
  return {
    slug: str(r.slug),
    nameKr: str(r.nameKr),
    nameEn: optStr(r.nameEn),
    level: (optStr(r.level) as RegionLevel | undefined) ?? undefined,
    parentSlug: optStr(r.parentSlug),
  };
}

// ─────────────────────────────────────────────
// Hospitals
// ─────────────────────────────────────────────

export const getAllHospitals = cache(async (): Promise<Hospital[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "hospitals",
    limit: 1000,
    sort: "createdAt", // 시드 입력 순서 유지
    depth: 0,
  });
  return (res.docs as unknown as Raw[]).map(mapHospital);
});

export async function getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
  const all = await getAllHospitals();
  return all.find((h) => h.slug === slug);
}

export async function getHospitalsByDeptAndRegion(
  deptSlug: string,
  regionSlug?: string,
  sidoSlug?: string
): Promise<Hospital[]> {
  const all = await getAllHospitals();
  return all.filter((h) => {
    if (h.departmentSlug !== deptSlug) return false;
    if (regionSlug && h.regionSlug !== regionSlug) return false;
    // 구 이름이 도시 간 중복될 수 있어 시/도까지 일치해야 함(있을 때만)
    if (sidoSlug && h.sidoSlug && h.sidoSlug !== sidoSlug) return false;
    return true;
  });
}

export async function getCurationHospitals(limit = 3): Promise<Hospital[]> {
  const all = await getAllHospitals();
  return all.filter((h) => h.tier === "PREMIUM" && h.curationNote).slice(0, limit);
}

export async function getDoctorBySlug(slug: string): Promise<Doctor | undefined> {
  const all = await getAllHospitals();
  for (const h of all) {
    const doc = h.doctors.find((d) => d.slug === slug);
    if (doc) return doc;
  }
  return undefined;
}

export async function getHospitalByDoctorSlug(slug: string): Promise<Hospital | undefined> {
  const all = await getAllHospitals();
  return all.find((h) => h.doctors.some((d) => d.slug === slug));
}

export async function getDoctorsByHospitalSlug(slug: string): Promise<Doctor[]> {
  const h = await getHospitalBySlug(slug);
  return h?.doctors ?? [];
}

// ─────────────────────────────────────────────
// Departments / Regions
// ─────────────────────────────────────────────

export const getAllDepartments = cache(async (): Promise<Department[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "departments",
    limit: 200,
    sort: "priority",
    depth: 0,
  });
  return (res.docs as unknown as Raw[]).map(mapDepartment);
});

export async function getDepartmentBySlug(slug: string): Promise<Department | undefined> {
  const all = await getAllDepartments();
  return all.find((d) => d.slug === slug);
}

/**
 * 진료과 URL 세그먼트(한국어 nameKr, 예: "치과") → Department.
 * 내부 slug(영문 "dental")는 그대로 유지하고 URL만 한국어로 노출하기 위한 매핑.
 * 구(舊) 영문 slug로 들어와도(리다이렉트 전 캐시 등) 해석되도록 fallback 포함.
 */
export async function getDepartmentByUrlName(
  urlName: string
): Promise<Department | undefined> {
  const all = await getAllDepartments();
  const decoded = (() => {
    try {
      return decodeURIComponent(urlName);
    } catch {
      return urlName;
    }
  })();
  return all.find((d) => d.nameKr === decoded) ?? all.find((d) => d.slug === decoded);
}

/** 진료과의 URL 세그먼트(한국어) — 링크 생성용 */
export function deptUrlName(dept: Department): string {
  return dept.nameKr;
}

export const getAllRegions = cache(async (): Promise<Region[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "regions",
    limit: 500,
    depth: 0,
  });
  return (res.docs as unknown as Raw[]).map(mapRegion);
});

export async function getRegionBySlug(slug: string): Promise<Region | undefined> {
  const all = await getAllRegions();
  return all.find((r) => r.slug === slug);
}

/** 시/도 region (slug로 조회 — 시/도명은 전국 고유) */
export async function getSidoRegion(sidoSlug: string): Promise<Region | undefined> {
  const all = await getAllRegions();
  return all.find((r) => r.level === "sido" && r.slug === sidoSlug);
}

/**
 * 시군구(구) region을 상위 시/도 스코프로 조회.
 * '서구'처럼 도시 간 중복되는 구 이름을 정확히 해석하기 위해 parentSlug(시/도)까지 일치시킴.
 */
export async function getSigunguRegion(
  sidoSlug: string,
  guSlug: string
): Promise<Region | undefined> {
  const all = await getAllRegions();
  return (
    all.find(
      (r) => r.level === "sigungu" && r.slug === guSlug && r.parentSlug === sidoSlug
    ) ?? all.find((r) => r.level === "sigungu" && r.slug === guSlug)
  );
}

export async function getRegionsByParent(parentSlug: string): Promise<Region[]> {
  const all = await getAllRegions();
  return all.filter((r) => r.parentSlug === parentSlug);
}

/** depth별 지역 목록 (예: 시도 목록 = getRegionsByLevel("sido")) */
export async function getRegionsByLevel(level: RegionLevel): Promise<Region[]> {
  const all = await getAllRegions();
  return all.filter((r) => r.level === level);
}

/** 직계 하위 지역 (시도→구, 구→동). getRegionsByParent 별칭 */
export async function getChildRegions(parentSlug: string): Promise<Region[]> {
  return getRegionsByParent(parentSlug);
}

/** parentSlug를 거슬러 올라간 breadcrumb 경로 [시도, 구, 동] */
export async function getRegionPath(slug: string): Promise<Region[]> {
  const all = await getAllRegions();
  const bySlug = new Map(all.map((r) => [r.slug, r]));
  const path: Region[] = [];
  let cur = bySlug.get(slug);
  let guard = 0;
  while (cur && guard++ < 5) {
    path.unshift(cur);
    cur = cur.parentSlug ? bySlug.get(cur.parentSlug) : undefined;
  }
  return path;
}
