// 매거진 런타임 데이터 액세스 — Payload(magazines 컬렉션) 백엔드
// 서버 컴포넌트/메타데이터/generateStaticParams에서 사용.
// Payload → flat 매핑은 src/lib/payload-mappers.ts, 이 파일은 조회 함수만.
// React cache로 요청 단위 중복 쿼리 제거 (hospitals-data와 동일 패턴).

import { cache } from "react";
import { getPayloadClient } from "@/lib/payload";
import { mapMagazine, type Raw } from "@/lib/payload-mappers";
import { getRefSlugMaps } from "@/lib/hospitals-data";
import type { Magazine, MagazineType } from "@/types";

const findAll = cache(async (): Promise<Magazine[]> => {
  const payload = await getPayloadClient();
  const [res, refs] = await Promise.all([
    payload.find({
      collection: "magazines",
      limit: 1000,
      sort: "-publishedAt",
      depth: 0,
    }),
    getRefSlugMaps(),
  ]);
  return (res.docs as unknown as Raw[]).map((d) => mapMagazine(d, refs));
});

export async function getAllMagazines(): Promise<Magazine[]> {
  return findAll();
}

export async function getMagazineBySlug(
  slug: string
): Promise<Magazine | undefined> {
  const payload = await getPayloadClient();
  const [res, refs] = await Promise.all([
    payload.find({
      collection: "magazines",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    }),
    getRefSlugMaps(),
  ]);
  const doc = (res.docs as unknown as Raw[])[0];
  return doc ? mapMagazine(doc, refs) : undefined;
}

export async function getMagazinesByType(
  type: MagazineType
): Promise<Magazine[]> {
  const all = await findAll();
  return all.filter((m) => m.type === type);
}

export async function getMagazinesByHospital(
  hospitalSlug: string
): Promise<Magazine[]> {
  const all = await findAll();
  return all.filter((m) => m.linkedHospitalSlugs?.includes(hospitalSlug));
}

export async function getMagazinesByAuthorDoctorSlug(
  doctorSlug: string
): Promise<Magazine[]> {
  const all = await findAll();
  return all.filter((m) => m.authorDoctorSlug === doctorSlug);
}

/** 의사 저자가 쓴 다른 글 (현재 글 제외) — 매거진 상세 AuthorProfile용 */
export async function getAuthorOtherArticles(
  doctorSlug: string,
  excludeSlug: string
): Promise<Magazine[]> {
  const all = await getMagazinesByAuthorDoctorSlug(doctorSlug);
  return all.filter((m) => m.slug !== excludeSlug);
}

/** 같은 진료과 또는 같은 시술을 다룬 관련 매거진 — 매거진 상세 하단용 */
export async function getRelatedMagazines(
  magazine: Magazine,
  limit = 3
): Promise<Magazine[]> {
  const all = await findAll();
  return all
    .filter(
      (m) =>
        m.slug !== magazine.slug &&
        (m.linkedDepartmentSlug === magazine.linkedDepartmentSlug ||
          m.linkedTreatmentSlug === magazine.linkedTreatmentSlug)
    )
    .slice(0, limit);
}

/** 의원에 소속된 모든 의사가 쓴 매거진. doctorSlugs는 getDoctorsByHospitalSlug 결과 */
export async function getMagazinesByDoctorSlugs(
  doctorSlugs: string[]
): Promise<Magazine[]> {
  const all = await findAll();
  return all.filter(
    (m) => m.authorDoctorSlug && doctorSlugs.includes(m.authorDoctorSlug)
  );
}

export async function getMagazinesByDepartment(
  deptSlug: string
): Promise<Magazine[]> {
  const all = await findAll();
  return all.filter((m) => m.linkedDepartmentSlug === deptSlug);
}

export async function getRecentMagazines(limit = 6): Promise<Magazine[]> {
  const all = await findAll();
  return all.slice(0, limit);
}
