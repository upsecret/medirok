/**
 * slug → 관계(FK) 백필 — slug→FK 전환(docs/db-reference-migration-plan.md) M2
 *
 * 채우는 관계:
 *   regions.parent          ← parentSlug
 *   hospitals.department    ← departmentSlug
 *   hospitals.region        ← dongSlug(있으면) 또는 regionSlug
 *   doctors(신규 컬렉션)     ← hospitals.doctors[] 임베드 배열에서 승격 (hospital 관계 포함)
 *   magazines.authorDoctor  ← authorDoctorSlug
 *   magazines.linkedHospitals ← linkedHospitalSlugs
 *   magazines.linkedDepartment/linkedRegion ← 대응 slug
 *
 * 멱등: 재실행 안전 (upsert/덮어쓰기). 매칭 실패는 경고 로그 후 skip.
 * 실행: 로컬  node --env-file=.env.e2e --import tsx/esm scripts/backfill-references.ts
 *       운영  node --env-file=.env.local --import tsx/esm scripts/backfill-references.ts
 *
 * ⚠ 운영 적용 순서 (중요): 이 스크립트는 레거시 slug 텍스트 필드를 읽으므로
 *   반드시 M1~M4 스키마(레거시 필드 병존) 상태에서 실행해야 한다.
 *   M5 스키마(레거시 필드 제거)를 배포하기 **전에** 운영 DB에서 실행할 것.
 *   순서: M1 스키마 배포 → 본 스크립트 실행 → 관계 NULL 0건 확인 → M5 배포.
 */

import { fileURLToPath } from "node:url";
import type { Payload } from "payload";
import { getSeedPayload } from "./seed-payload";

type P = Payload;
type Doc = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

async function findAllDocs(payload: P, collection: string): Promise<Doc[]> {
  const res = await payload.find({
    collection: collection as never,
    limit: 5000,
    depth: 0,
  });
  return res.docs as unknown as Doc[];
}

function slugIdMap(docs: Doc[]): Map<string, number | string> {
  return new Map(docs.map((d) => [str(d.slug), d.id as number | string]));
}

export async function backfillReferences(payload: P): Promise<void> {
  const [regions, departments, hospitals, magazines] = await Promise.all([
    findAllDocs(payload, "regions"),
    findAllDocs(payload, "departments"),
    findAllDocs(payload, "hospitals"),
    findAllDocs(payload, "magazines"),
  ]);
  const regionId = slugIdMap(regions);
  const deptId = slugIdMap(departments);
  const hospitalId = slugIdMap(hospitals);

  const warn = (msg: string) => console.warn(`  ⚠ ${msg}`);

  // 1) regions.parent ← parentSlug
  console.log(`• regions.parent 백필 (${regions.length}건 검사)`);
  for (const r of regions) {
    const parentSlug = str(r.parentSlug);
    if (!parentSlug) continue;
    const parent = regionId.get(parentSlug);
    if (!parent) {
      warn(`region ${r.slug}: parentSlug "${parentSlug}" 매칭 실패`);
      continue;
    }
    if (r.parent === parent) continue;
    await payload.update({
      collection: "regions",
      id: r.id as never,
      data: { parent } as never,
    });
  }

  // 2) hospitals.department / hospitals.region
  console.log(`• hospitals.department/region 백필 (${hospitals.length}건 검사)`);
  for (const h of hospitals) {
    const data: Doc = {};
    const dept = deptId.get(str(h.departmentSlug));
    if (dept) {
      if (h.department !== dept) data.department = dept;
    } else if (str(h.departmentSlug)) {
      warn(`hospital ${h.slug}: departmentSlug "${h.departmentSlug}" 매칭 실패`);
    }

    // 최하위 지역 참조: 동 우선, 없으면 시군구
    const regionSlug = str(h.dongSlug) || str(h.regionSlug);
    const region = regionId.get(regionSlug);
    if (region) {
      if (h.region !== region) data.region = region;
    } else if (regionSlug) {
      warn(`hospital ${h.slug}: 지역 slug "${regionSlug}" 매칭 실패`);
    }

    if (Object.keys(data).length > 0) {
      await payload.update({ collection: "hospitals", id: h.id as never, data });
    }
  }

  // 3) doctors 승격: hospitals.doctors[] → doctors 컬렉션 (slug 기준 upsert)
  console.log("• doctors 컬렉션 승격 (임베드 배열 → 독립 문서)");
  for (const h of hospitals) {
    if (!Array.isArray(h.doctors)) continue;
    for (const d of h.doctors as Doc[]) {
      const slug = str(d.slug);
      if (!slug) continue;
      const data = {
        slug,
        nameKr: str(d.nameKr),
        nameHanja: str(d.nameHanja) || undefined,
        title: str(d.title) || undefined,
        yearsExperience: typeof d.yearsExperience === "number" ? d.yearsExperience : undefined,
        specialty: str(d.specialty) || undefined,
        credentials: Array.isArray(d.credentials) ? d.credentials : undefined,
        hospital: h.id,
      };
      const existing = await payload.find({
        collection: "doctors",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      });
      if (existing.docs.length > 0) {
        await payload.update({ collection: "doctors", id: existing.docs[0].id, data: data as never });
      } else {
        await payload.create({ collection: "doctors", data: data as never });
      }
    }
  }
  const doctorId = slugIdMap(await findAllDocs(payload, "doctors"));

  // 4) magazines 관계
  console.log(`• magazines 관계 백필 (${magazines.length}건 검사)`);
  for (const m of magazines) {
    const data: Doc = {};

    const authorSlug = str(m.authorDoctorSlug);
    if (authorSlug) {
      const doctor = doctorId.get(authorSlug);
      if (doctor) data.authorDoctor = doctor;
      else warn(`magazine ${m.slug}: authorDoctorSlug "${authorSlug}" 매칭 실패`);
    }

    if (Array.isArray(m.linkedHospitalSlugs) && m.linkedHospitalSlugs.length > 0) {
      const ids = (m.linkedHospitalSlugs as unknown[])
        .map((s) => hospitalId.get(str(s)))
        .filter((v): v is number | string => v != null);
      if (ids.length !== (m.linkedHospitalSlugs as unknown[]).length) {
        warn(`magazine ${m.slug}: linkedHospitalSlugs 일부 매칭 실패`);
      }
      if (ids.length > 0) data.linkedHospitals = ids;
    }

    const linkedDeptSlug = str(m.linkedDepartmentSlug);
    if (linkedDeptSlug) {
      const linkedDept = deptId.get(linkedDeptSlug);
      if (linkedDept) data.linkedDepartment = linkedDept;
      else warn(`magazine ${m.slug}: linkedDepartmentSlug "${linkedDeptSlug}" 매칭 실패`);
    }

    // 지역: slug 직매칭 → (레거시 영문 slug 대비) nameEn 소문자 fallback
    const linkedRegionSlug = str(m.linkedRegionSlug);
    if (linkedRegionSlug) {
      const byNameEn = new Map(
        regions
          .filter((r) => str(r.nameEn))
          .map((r) => [str(r.nameEn).toLowerCase(), r.id as number | string])
      );
      const linkedRegion =
        regionId.get(linkedRegionSlug) ?? byNameEn.get(linkedRegionSlug.toLowerCase());
      if (linkedRegion) data.linkedRegion = linkedRegion;
      else warn(`magazine ${m.slug}: linkedRegionSlug "${linkedRegionSlug}" 매칭 실패`);
    }

    if (Object.keys(data).length > 0) {
      await payload.update({ collection: "magazines", id: m.id as never, data: data as never });
    }
  }

  console.log("✓ 관계 백필 완료");
}

// 직접 실행 시
const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (isDirectRun || process.argv[1]?.endsWith("backfill-references.ts")) {
  const payload = await getSeedPayload();
  await backfillReferences(payload);
  process.exit(0);
}
