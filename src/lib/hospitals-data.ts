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
  PriceRange,
  Review,
  HospitalTier,
  DepartmentSlug,
  MedirokCertification,
  CurationNote,
} from "@/types";

type Raw = Record<string, unknown>;

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
    regionSlug: str(doc.regionSlug),
    addressLine: str(doc.addressLine),
    nearestStation: optStr(doc.nearestStation),
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
  return (res.docs as Raw[]).map(mapHospital);
});

export async function getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
  const all = await getAllHospitals();
  return all.find((h) => h.slug === slug);
}

export async function getHospitalsByDeptAndRegion(
  deptSlug: string,
  regionSlug?: string
): Promise<Hospital[]> {
  const all = await getAllHospitals();
  return all.filter((h) => {
    if (h.departmentSlug !== deptSlug) return false;
    if (regionSlug && h.regionSlug !== regionSlug) return false;
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
  return (res.docs as Raw[]).map(mapDepartment);
});

export async function getDepartmentBySlug(slug: string): Promise<Department | undefined> {
  const all = await getAllDepartments();
  return all.find((d) => d.slug === slug);
}

export const getAllRegions = cache(async (): Promise<Region[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "regions",
    limit: 500,
    depth: 0,
  });
  return (res.docs as Raw[]).map(mapRegion);
});

export async function getRegionBySlug(slug: string): Promise<Region | undefined> {
  const all = await getAllRegions();
  return all.find((r) => r.slug === slug);
}

export async function getRegionsByParent(parentSlug: string): Promise<Region[]> {
  const all = await getAllRegions();
  return all.filter((r) => r.parentSlug === parentSlug);
}
