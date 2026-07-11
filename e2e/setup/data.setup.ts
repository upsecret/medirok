// 테스트 데이터 픽스처 준비 — Payload REST API로 시드 데이터를 확인하고
// 스펙들이 공유할 slug/경로 샘플을 e2e/.state.json에 기록한다.
// slug→FK 전환(M5) 이후: 병원 문서는 관계(id)만 가지므로
// regions/departments/doctors를 함께 조회해 지역·진료과 샘플을 파생한다.
import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { E2EState } from "../helpers";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(HERE, "..", ".state.json");

type Doc = Record<string, unknown>;

const relId = (v: unknown): number | string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "object") return (v as Doc).id as number | string;
  return undefined;
};

setup("시드 데이터 확인 및 픽스처 기록", async ({ request }) => {
  const state: E2EState = {
    hospitalCount: 0,
    hospitalSlug: null,
    magazineCount: 0,
    magazineSlug: null,
    magazine: null,
    region: null,
    crossLinks: {
      authorMagazineSlug: null,
      authorDoctorName: null,
      authorHospitalSlug: null,
      linkedHospitalsMagazineSlug: null,
      hospitalWithAuthoredMagsSlug: null,
    },
  };

  // ── 참조 데이터 (관계 id 해석용) ──
  const [hRes, rRes, dRes, docRes] = await Promise.all([
    request.get("/api/hospitals?limit=20&depth=0"),
    request.get("/api/regions?limit=500&depth=0"),
    request.get("/api/departments?limit=100&depth=0"),
    request.get("/api/doctors?limit=200&depth=0"),
  ]);
  expect(hRes.status(), "Payload REST /api/hospitals 응답 확인").toBe(200);
  expect(rRes.status(), "Payload REST /api/regions 응답 확인").toBe(200);
  expect(dRes.status(), "Payload REST /api/departments 응답 확인").toBe(200);
  expect(docRes.status(), "Payload REST /api/doctors 응답 확인").toBe(200);

  const hBody = (await hRes.json()) as { docs?: Doc[]; totalDocs?: number };
  const regions = ((await rRes.json()) as { docs?: Doc[] }).docs ?? [];
  const departments = ((await dRes.json()) as { docs?: Doc[] }).docs ?? [];
  const doctors = ((await docRes.json()) as { docs?: Doc[] }).docs ?? [];

  const regionById = new Map(regions.map((r) => [r.id as number | string, r]));
  const deptById = new Map(departments.map((d) => [d.id as number | string, d]));
  const hospitalIdsWithDoctors = new Set(
    doctors.map((d) => relId(d.hospital)).filter((v) => v != null)
  );

  state.hospitalCount = hBody.totalDocs ?? hBody.docs?.length ?? 0;
  const docs = hBody.docs ?? [];

  // 상세 페이지 테스트(의료진·후기·인증 박스)가 유의미하도록 데이터가 풍부한 병원 우선
  const firstHospital =
    docs.find(
      (d) =>
        hospitalIdsWithDoctors.has(relId(d.id) ?? (d.id as number | string)) &&
        Array.isArray(d.reviews) &&
        (d.reviews as unknown[]).length > 0 &&
        d.certification &&
        relId(d.region) != null
    ) ?? docs[0];

  if (firstHospital) {
    state.hospitalSlug = String(firstHospital.slug ?? "") || null;

    // 지역 SEO 경로 샘플: region 관계 → 부모 체인으로 동/구/시도 파생
    const chain: Doc[] = [];
    let cur = regionById.get(relId(firstHospital.region) ?? "");
    let guard = 0;
    while (cur && guard++ < 4) {
      chain.unshift(cur);
      const pid = relId(cur.parent);
      cur = pid != null ? regionById.get(pid) : undefined;
    }
    const byLevel = (lvl: string) => chain.find((r) => r.level === lvl);
    const sidoDoc = byLevel("sido");
    const guDoc = byLevel("sigungu");
    const deptDoc = deptById.get(relId(firstHospital.department) ?? "");

    if (sidoDoc && guDoc && deptDoc) {
      state.region = {
        sido: String(sidoDoc.slug),
        gu: String(guDoc.slug),
        dept: String(deptDoc.nameKr),
        sidoName: String(sidoDoc.nameKr ?? sidoDoc.slug),
        guName: String(guDoc.nameKr ?? guDoc.slug),
      };
    }
  }

  // ── 매거진 ──
  const mRes = await request.get("/api/magazines?limit=100&depth=0&sort=-publishedAt");
  expect(mRes.status(), "Payload REST /api/magazines 응답 확인").toBe(200);
  const mBody = (await mRes.json()) as { docs?: Doc[]; totalDocs?: number };
  state.magazineCount = mBody.totalDocs ?? mBody.docs?.length ?? 0;
  const magazineDocs = mBody.docs ?? [];

  // 200을 반환하는 첫 매거진 slug 탐색 (미공개 글 등 방어)
  for (const doc of magazineDocs) {
    const slug = String(doc.slug ?? "");
    if (!slug) continue;
    const res = await request.get(`/magazine/${encodeURIComponent(slug)}`);
    if (res.status() === 200) {
      state.magazineSlug = slug;
      state.magazine = {
        hasShortAnswer: Boolean(String(doc.shortAnswer ?? "").trim()),
        hasFaq: Array.isArray(doc.faqBlocks) && doc.faqBlocks.length > 0,
        category: String(doc.category ?? "") || null,
        type: String(doc.type ?? "") || null,
      };
      break;
    }
  }

  // ── 관계 교차링크 픽스처 (slug→FK 전환으로 생긴 cross-link) ──
  // 관계는 depth=0에서 id(단수) / id 배열(hasMany)로 온다.
  const doctorById = new Map(doctors.map((d) => [relId(d.id) ?? (d.id as number | string), d]));
  const hospitalById = new Map(docs.map((h) => [relId(h.id) ?? (h.id as number | string), h]));

  // (1) authorDoctor가 실제 의사로 해석되는 매거진 + 그 의사의 소속 의원
  for (const m of magazineDocs) {
    const docId = relId(m.authorDoctor);
    const doctor = docId != null ? doctorById.get(docId) : undefined;
    if (!doctor) continue;
    const hospital = hospitalById.get(relId(doctor.hospital) ?? "");
    state.crossLinks.authorMagazineSlug = String(m.slug ?? "") || null;
    state.crossLinks.authorDoctorName = String(doctor.nameKr ?? "") || null;
    state.crossLinks.authorHospitalSlug = hospital ? String(hospital.slug ?? "") || null : null;
    if (state.crossLinks.authorHospitalSlug) break; // 병원 링크까지 가능한 것을 우선
  }

  // (2) linkedHospitals(hasMany)가 1건 이상인 매거진
  const linkedMag = magazineDocs.find(
    (m) => Array.isArray(m.linkedHospitals) && (m.linkedHospitals as unknown[]).length > 0
  );
  if (linkedMag) state.crossLinks.linkedHospitalsMagazineSlug = String(linkedMag.slug ?? "") || null;

  // (3) 소속 의사가 매거진을 1편 이상 쓴 의원
  const authoredDoctorIds = new Set(
    magazineDocs.map((m) => relId(m.authorDoctor)).filter((v) => v != null)
  );
  const authoredHospitalIds = new Set(
    doctors
      .filter((d) => authoredDoctorIds.has(relId(d.id) ?? (d.id as number | string)))
      .map((d) => relId(d.hospital))
      .filter((v) => v != null)
  );
  const hospitalWithMags = docs.find((h) =>
    authoredHospitalIds.has(relId(h.id) ?? (h.id as number | string))
  );
  if (hospitalWithMags) {
    state.crossLinks.hospitalWithAuthoredMagsSlug = String(hospitalWithMags.slug ?? "") || null;
  }

  if (state.hospitalCount === 0) {
    console.warn(
      "⚠️  Payload DB에 병원 데이터가 없습니다. 관련 테스트는 skip됩니다. (시드: npm run e2e:seed)"
    );
  }
  if (state.magazineCount === 0) {
    console.warn("⚠️  Payload DB에 매거진 데이터가 없습니다. 관련 테스트는 skip됩니다.");
  }

  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
});
