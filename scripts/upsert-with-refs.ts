/**
 * slug 표기 데이터 → 관계(FK) 변환 upsert 헬퍼 — slug→FK 전환 M4
 *
 * 시드/등록 스크립트는 사람이 읽기 쉬운 slug 필드(departmentSlug 등)로 데이터를
 * 정의하고, 쓰기 직전에 이 헬퍼가 관계 필드로 변환한다.
 * M5(레거시 slug 컬럼 제거) 이후에도 스크립트 데이터 정의는 그대로 유지된다.
 *
 * 변환 규칙:
 *   regions:   parentSlug → parent
 *   hospitals: departmentSlug → department, (dongSlug ?? regionSlug) → region,
 *              doctors[] 임베드 → doctors 컬렉션 upsert (hospital 관계 포함)
 *   magazines: authorDoctorSlug → authorDoctor, linkedHospitalSlugs → linkedHospitals,
 *              linkedDepartmentSlug → linkedDepartment, linkedRegionSlug → linkedRegion
 *
 * 주의: 참조 대상이 먼저 존재해야 한다 (departments/regions → hospitals → magazines 순).
 */

import type { Payload } from "payload";

type AnyData = Record<string, unknown>;
type Collection = "departments" | "regions" | "hospitals" | "doctors" | "magazines";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

// 실행 단위 slug→id 캐시
const idCache = new Map<string, number | string | null>();

async function findIdBySlug(
  payload: Payload,
  collection: Collection,
  slug: string
): Promise<number | string | null> {
  const key = `${collection}:${slug}`;
  const cached = idCache.get(key);
  if (cached !== undefined) return cached;
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  const id = (res.docs[0]?.id as number | string | undefined) ?? null;
  if (id == null) console.warn(`  ⚠ ${collection} slug "${slug}" 매칭 실패 (관계 미설정)`);
  idCache.set(key, id);
  return id;
}

/** slug 필드를 관계로 변환하고 upsert. 병원의 doctors 임베드는 doctors 컬렉션으로 승격. */
export async function upsertWithRefs(
  payload: Payload,
  collection: Collection,
  slug: string,
  dataIn: AnyData
): Promise<number | string> {
  const data: AnyData = { ...dataIn };
  let embeddedDoctors: AnyData[] | undefined;

  if (collection === "regions") {
    const parentSlug = str(data.parentSlug);
    if (parentSlug) data.parent = await findIdBySlug(payload, "regions", parentSlug);
    delete data.parentSlug;
  }

  if (collection === "hospitals") {
    const deptSlug = str(data.departmentSlug);
    if (deptSlug) data.department = await findIdBySlug(payload, "departments", deptSlug);
    const regionSlug = str(data.dongSlug) || str(data.regionSlug);
    if (regionSlug) data.region = await findIdBySlug(payload, "regions", regionSlug);
    delete data.departmentSlug;
    delete data.sidoSlug;
    delete data.regionSlug;
    delete data.dongSlug;

    if (Array.isArray(data.doctors)) {
      embeddedDoctors = data.doctors as AnyData[];
      if (data.doctorCount == null) data.doctorCount = embeddedDoctors.length;
      delete data.doctors;
    }
  }

  if (collection === "magazines") {
    const authorSlug = str(data.authorDoctorSlug);
    if (authorSlug) data.authorDoctor = await findIdBySlug(payload, "doctors", authorSlug);
    if (Array.isArray(data.linkedHospitalSlugs)) {
      const ids: (number | string)[] = [];
      for (const s of data.linkedHospitalSlugs as unknown[]) {
        const id = await findIdBySlug(payload, "hospitals", str(s));
        if (id != null) ids.push(id);
      }
      if (ids.length > 0) data.linkedHospitals = ids;
    }
    const linkedDeptSlug = str(data.linkedDepartmentSlug);
    if (linkedDeptSlug)
      data.linkedDepartment = await findIdBySlug(payload, "departments", linkedDeptSlug);
    const linkedRegionSlug = str(data.linkedRegionSlug);
    if (linkedRegionSlug)
      data.linkedRegion = await findIdBySlug(payload, "regions", linkedRegionSlug);
    delete data.authorDoctorSlug;
    delete data.linkedHospitalSlugs;
    delete data.linkedDepartmentSlug;
    delete data.linkedRegionSlug;
    // linkedTreatmentSlug는 대상 컬렉션이 없어 텍스트 유지
  }

  // ── 본문 upsert ──
  const existing = await payload.find({
    collection: collection as never,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  let id: number | string;
  if (existing.docs.length > 0) {
    id = existing.docs[0].id as number | string;
    await payload.update({ collection, id: id as never, data: data as never });
    console.log(`  ✓ update  ${collection}/${slug}`);
  } else {
    const created = await payload.create({ collection, data: data as never });
    id = created.id as number | string;
    console.log(`  ✓ create  ${collection}/${slug}`);
  }
  idCache.set(`${collection}:${slug}`, id);

  // ── 병원 임베드 의사 → doctors 컬렉션 승격 ──
  if (collection === "hospitals" && embeddedDoctors) {
    for (const d of embeddedDoctors) {
      const dSlug = str(d.slug);
      if (!dSlug) continue;
      await upsertWithRefs(payload, "doctors", dSlug, { ...d, hospital: id });
    }
  }

  return id;
}
