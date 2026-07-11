// 의원·진료과·지역 런타임 데이터 액세스 — Payload 백엔드
// 서버 컴포넌트/메타데이터/generateStaticParams에서 사용.
// Payload → flat 타입 매핑은 src/lib/payload-mappers.ts, 이 파일은 조회 함수만.
// slug→FK 전환 완료: flat slug 필드(departmentSlug/sidoSlug/...)는 관계(FK)에서 파생.
// React cache로 요청 단위 중복 쿼리 제거.

import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";
import {
  mapHospital,
  mapDepartment,
  mapRegion,
  mapDoctor,
  buildRegionIndex,
  slugById,
  relId,
  type HospitalRefContext,
  type Raw,
  type DocId,
} from "@/lib/payload-mappers";
import type { Hospital, Doctor, Department, Region, RegionLevel } from "@/types";

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

// ─────────────────────────────────────────────
// 내부 raw 도큐먼트 캐시 (관계 해석 컨텍스트용)
// ─────────────────────────────────────────────

const rawHospitalDocs = cache(async (): Promise<Raw[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "hospitals",
    limit: 1000,
    sort: "createdAt", // 시드 입력 순서 유지
    depth: 0,
  });
  return res.docs as unknown as Raw[];
});

const rawDepartmentDocs = cache(async (): Promise<Raw[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "departments",
    limit: 200,
    sort: "priority",
    depth: 0,
  });
  return res.docs as unknown as Raw[];
});

const rawRegionDocs = cache(async (): Promise<Raw[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "regions",
    limit: 500,
    depth: 0,
  });
  return res.docs as unknown as Raw[];
});

const rawDoctorDocs = cache(async (): Promise<Raw[]> => {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "doctors",
    limit: 2000,
    sort: "createdAt",
    depth: 0,
  });
  return res.docs as unknown as Raw[];
});

/** Hospital 매핑 컨텍스트 (관계 id → slug 해석 + 의사 그룹핑) */
const hospitalCtx = cache(async (): Promise<HospitalRefContext> => {
  const [regions, departments, doctors] = await Promise.all([
    rawRegionDocs(),
    rawDepartmentDocs(),
    rawDoctorDocs(),
  ]);
  const doctorsByHospitalId = new Map<DocId, Doctor[]>();
  for (const d of doctors) {
    const hid = relId(d.hospital);
    if (hid == null) continue;
    const list = doctorsByHospitalId.get(hid) ?? [];
    list.push(mapDoctor(d));
    doctorsByHospitalId.set(hid, list);
  }
  return {
    regionIndex: buildRegionIndex(regions),
    departmentSlugById: slugById(departments),
    doctorsByHospitalId,
  };
});

/** 관계 id → slug 해석 맵 (magazines-data 등 다른 데이터 모듈 공용) */
export const getRefSlugMaps = cache(async () => {
  const [hospitals, departments, regions, doctors] = await Promise.all([
    rawHospitalDocs(),
    rawDepartmentDocs(),
    rawRegionDocs(),
    rawDoctorDocs(),
  ]);
  return {
    hospitalSlugById: slugById(hospitals),
    departmentSlugById: slugById(departments),
    regionSlugById: slugById(regions),
    doctorSlugById: slugById(doctors),
  } as {
    hospitalSlugById: Map<DocId, string>;
    departmentSlugById: Map<DocId, string>;
    regionSlugById: Map<DocId, string>;
    doctorSlugById: Map<DocId, string>;
  };
});

// ─────────────────────────────────────────────
// Hospitals
// ─────────────────────────────────────────────

export const getAllHospitals = cache(async (): Promise<Hospital[]> => {
  const [docs, ctx] = await Promise.all([rawHospitalDocs(), hospitalCtx()]);
  return docs.map((d) => mapHospital(d, ctx));
});

export async function getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
  const all = await getAllHospitals();
  return all.find((h) => h.slug === slug);
}

/** slug 목록으로 병원 조회 (매거진 linkedHospitalSlugs 등) — 입력 순서 무관, 존재하는 것만 */
export async function getHospitalsBySlugs(slugs: string[]): Promise<Hospital[]> {
  if (slugs.length === 0) return [];
  const all = await getAllHospitals();
  const wanted = new Set(slugs);
  return all.filter((h) => wanted.has(h.slug));
}

/**
 * 지역×진료과 병원 조회 — 관계(FK) where 쿼리 (M6: SQL 고도화)
 * department = 진료과 id, region IN (구 id + 하위 동 id들) 단일 인덱스 쿼리.
 * 구 이름이 도시 간 중복돼도 관계 기반이라 정확 (sidoSlug 스코프 불필요 — 구 id가 유일).
 */
export async function getHospitalsByDeptAndRegion(
  deptSlug: string,
  regionSlug?: string,
  sidoSlug?: string
): Promise<Hospital[]> {
  const [payload, ctx, departments, regions] = await Promise.all([
    getPayloadClient(),
    hospitalCtx(),
    rawDepartmentDocs(),
    rawRegionDocs(),
  ]);

  const dept = departments.find((d) => d.slug === deptSlug);
  if (!dept) return [];

  const conditions: Record<string, unknown>[] = [
    { department: { equals: dept.id } },
  ];

  if (regionSlug) {
    // 시/도 스코프 내 구(gu) 해석 (중복 구 이름 대응) 후, 구 + 하위 동 id 집합으로 매칭
    const index = buildRegionIndex(regions);
    const candidates = regions.filter((r) => r.slug === regionSlug && r.level === "sigungu");
    const gu =
      candidates.find((r) => {
        const pid = relId(r.parent);
        return sidoSlug && pid != null ? index.get(pid)?.slug === sidoSlug : true;
      }) ?? candidates[0];
    if (!gu) return [];
    const regionIds = [
      gu.id as DocId,
      ...regions.filter((r) => relId(r.parent) === gu.id).map((r) => r.id as DocId),
    ];
    conditions.push({ region: { in: regionIds } });
  }

  const res = await payload.find({
    collection: "hospitals",
    where: { and: conditions } as never,
    limit: 1000,
    sort: "createdAt",
    depth: 0,
  });
  return (res.docs as unknown as Raw[]).map((d) => mapHospital(d, ctx));
}

/** 같은 진료과의 다른 병원 (병원 상세 '비슷한 병원' 섹션) */
export async function getSimilarHospitals(
  deptSlug: string,
  excludeSlug: string
): Promise<Hospital[]> {
  const all = await getAllHospitals();
  return all.filter((h) => h.departmentSlug === deptSlug && h.slug !== excludeSlug);
}

export async function getCurationHospitals(limit = 3): Promise<Hospital[]> {
  const all = await getAllHospitals();
  return all.filter((h) => h.tier === "PREMIUM" && h.curationNote).slice(0, limit);
}

// ─────────────────────────────────────────────
// Doctors (독립 컬렉션 — 구 hospitals.doctors 임베드에서 승격)
// ─────────────────────────────────────────────

export async function getDoctorBySlug(slug: string): Promise<Doctor | undefined> {
  const docs = await rawDoctorDocs();
  const d = docs.find((doc) => doc.slug === slug);
  return d ? mapDoctor(d) : undefined;
}

export async function getHospitalByDoctorSlug(slug: string): Promise<Hospital | undefined> {
  const docs = await rawDoctorDocs();
  const d = docs.find((doc) => doc.slug === slug);
  const hid = d ? relId(d.hospital) : undefined;
  if (hid == null) return undefined;
  const [hospitals, ctx] = await Promise.all([rawHospitalDocs(), hospitalCtx()]);
  const h = hospitals.find((doc) => doc.id === hid);
  return h ? mapHospital(h, ctx) : undefined;
}

export async function getDoctorsByHospitalSlug(slug: string): Promise<Doctor[]> {
  const h = await getHospitalBySlug(slug);
  return h?.doctors ?? [];
}

// ─────────────────────────────────────────────
// Departments / Regions
// ─────────────────────────────────────────────

export const getAllDepartments = cache(async (): Promise<Department[]> => {
  const docs = await rawDepartmentDocs();
  return docs.map(mapDepartment);
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
  const decoded = decodeParam(urlName);
  return all.find((d) => d.nameKr === decoded) ?? all.find((d) => d.slug === decoded);
}

/** 진료과의 URL 세그먼트(한국어) — 링크 생성용 */
export function deptUrlName(dept: Department): string {
  return dept.nameKr;
}

export const getAllRegions = cache(async (): Promise<Region[]> => {
  const docs = await rawRegionDocs();
  const index = buildRegionIndex(docs);
  return docs.map((d) => mapRegion(d, index));
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
 * '서구'처럼 도시 간 중복되는 구 이름을 정확히 해석하기 위해 parent(시/도)까지 일치시킴.
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
