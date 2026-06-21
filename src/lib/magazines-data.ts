// 매거진 런타임 데이터 액세스 — Payload(magazines 컬렉션) 백엔드
// 서버 컴포넌트/메타데이터/generateStaticParams에서 사용.
// Payload 도큐먼트를 프론트엔드 flat `Magazine` 형태로 매핑.

import { getPayloadClient } from "@/lib/payload";
import type { Magazine, MagazineType } from "@/lib/magazines";

type Raw = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function strArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const arr = v.map(str).filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

function optStr(v: unknown): string | undefined {
  const s = str(v).trim();
  return s || undefined;
}

function dayOnly(v: unknown): string {
  const s = str(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function mapDoc(doc: Raw): Magazine {
  return {
    slug: str(doc.slug),
    type: str(doc.type) as MagazineType,
    seoTitle: str(doc.seoTitle),
    metaDescription: str(doc.metaDescription),
    shortAnswer: str(doc.shortAnswer),
    body: str(doc.body),
    targetKeywords: strArr(doc.targetKeywords) ?? [],
    faqBlocks: Array.isArray(doc.faqBlocks)
      ? (doc.faqBlocks as Raw[])
          .map((f) => ({ question: str(f.question), answer: str(f.answer) }))
          .filter((f) => f.question && f.answer)
      : undefined,
    priceTable: Array.isArray(doc.priceTable)
      ? (doc.priceTable as Raw[])
          .map((p) => ({
            treatment: str(p.treatment),
            priceRange: str(p.priceRange),
            note: optStr(p.note),
          }))
          .filter((p) => p.treatment && p.priceRange)
      : undefined,
    linkedHospitalSlugs: strArr(doc.linkedHospitalSlugs),
    linkedDepartmentSlug: optStr(doc.linkedDepartmentSlug),
    linkedRegionSlug: optStr(doc.linkedRegionSlug),
    linkedTreatmentSlug: optStr(doc.linkedTreatmentSlug),
    authorDoctorSlug: optStr(doc.authorDoctorSlug),
    authorName: optStr(doc.authorName),
    authorTitle: optStr(doc.authorTitle),
    disclaimerType: (str(doc.disclaimerType) ||
      "general") as Magazine["disclaimerType"],
    publishedAt: dayOnly(doc.publishedAt),
    category: str(doc.category),
  };
}

async function findAll(): Promise<Magazine[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "magazines",
    limit: 1000,
    sort: "-publishedAt",
    depth: 0,
  });
  return (res.docs as unknown as Raw[]).map(mapDoc);
}

export async function getAllMagazines(): Promise<Magazine[]> {
  return findAll();
}

export async function getMagazineBySlug(
  slug: string
): Promise<Magazine | undefined> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "magazines",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  const doc = (res.docs as unknown as Raw[])[0];
  return doc ? mapDoc(doc) : undefined;
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

/** 의원에 소속된 모든 의사가 쓴 매거진. doctorSlugs는 data.ts의 getDoctorsByHospitalSlug 결과 */
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
