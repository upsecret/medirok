// Payload 도큐먼트 → 프론트엔드 flat 타입 매퍼
// (hospitals/departments/regions/magazines 공용)
// 수동 매핑을 한 곳에 모아 컬렉션 스키마 변경 시 수정 지점을 단일화한다.

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
  Magazine,
  MagazineType,
  BlogPost,
  Thumbnail,
} from "@/types";

export type Raw = Record<string, unknown>;

// ─────────────────────────────────────────────
// 관계(FK) 해석 컨텍스트 — slug→FK 전환 M3
// 관계 필드(id)를 slug로 해석해 프론트엔드 flat 타입을 유지한다.
// 레거시 slug 텍스트 필드는 fallback (M5에서 제거 예정).
// ─────────────────────────────────────────────

export type DocId = number | string;

/** depth:0 관계 값(id) 또는 populate된 객체에서 id 추출 */
export function relId(v: unknown): DocId | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "object") return (v as Raw).id as DocId | undefined;
  return undefined;
}

export interface RegionNode {
  slug: string;
  level?: string;
  parentId?: DocId;
}
export type RegionIndex = Map<DocId, RegionNode>;

/** regions raw 도큐먼트 → 부모 체인 해석용 인덱스 */
export function buildRegionIndex(rawRegions: Raw[]): RegionIndex {
  return new Map(
    rawRegions.map((r) => [
      r.id as DocId,
      {
        slug: typeof r.slug === "string" ? r.slug : String(r.slug ?? ""),
        level: typeof r.level === "string" ? r.level : undefined,
        parentId: relId(r.parent),
      },
    ])
  );
}

/** 지역 참조(최하위)에서 부모 체인을 따라 시도/시군구/동 slug 파생 */
function deriveRegionSlugs(
  regionRef: unknown,
  index: RegionIndex
): { sido?: string; gu?: string; dong?: string } {
  const startId = relId(regionRef);
  if (startId == null) return {};
  const out: { sido?: string; gu?: string; dong?: string } = {};
  let cur = index.get(startId);
  let guard = 0;
  while (cur && guard++ < 4) {
    if (cur.level === "dong") out.dong = cur.slug;
    else if (cur.level === "sigungu") out.gu = cur.slug;
    else if (cur.level === "sido") out.sido = cur.slug;
    cur = cur.parentId != null ? index.get(cur.parentId) : undefined;
  }
  return out;
}

/** Hospital 매핑용 관계 컨텍스트 */
export interface HospitalRefContext {
  regionIndex: RegionIndex;
  departmentSlugById: Map<DocId, string>;
  /** doctors 컬렉션 문서를 hospital id로 그룹핑한 맵 */
  doctorsByHospitalId: Map<DocId, Doctor[]>;
  /** 로고(media) 해석용 — MagazineRefContext와 같은 맵을 공유한다 */
  thumbnailById: Map<DocId, Thumbnail>;
}

/** Magazine 매핑용 관계 컨텍스트 */
export interface MagazineRefContext {
  hospitalSlugById: Map<DocId, string>;
  doctorSlugById: Map<DocId, string>;
  departmentSlugById: Map<DocId, string>;
  regionSlugById: Map<DocId, string>;
  thumbnailById: Map<DocId, Thumbnail>;
}

/**
 * Vercel Blob CDN 베이스 URL. 토큰에서 스토어 id를 뽑는 규칙은
 * storage-vercel-blob/dist/index.js:24와 동일하다.
 * 서버에서만 평가된다 — 매핑 결과가 직렬화되어 내려가므로 클라이언트는 재계산하지 않는다.
 */
const BLOB_BASE = (() => {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(
    /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i,
  )?.[1];
  return storeId ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` : "";
})();

const MEDIA_PROXY_PREFIX = "/api/media/file/";

/**
 * Payload 미디어 URL → Vercel Blob CDN 직결 URL.
 *
 * Payload가 내보내는 url은 Blob을 쓸 때조차 **항상** `/api/media/file/<filename>`이다.
 * `vercelBlobStorage` 래퍼가 `disablePayloadAccessControl`을 cloudStoragePlugin에
 * 전달하지 않아(세 개 옵션만 넘긴다) Blob 절대 URL 경로 자체가 열리지 않는다.
 *
 * 그 프록시 경로는 요청 1건마다 [서버리스 부팅 → media 4-way OR 쿼리 → Blob HEAD →
 * Blob GET]이 돌고, 마지막 GET에 `Cache-Control: no-store`가 박혀 있어
 * (storage-vercel-blob/dist/getFile.js:65) 업로드 시 지정한 1년 캐시가 무력화된다.
 * 운영 실측 콜드 TTFB 1.8~2.8s — 같은 이미지의 CDN 경로는 0.09s다.
 *
 * 파일명이 Blob 키와 1:1이므로 여기서 CDN 주소로 바꾼다. 토큰이 없는 환경
 * (e2e docker·로컬)은 로컬 디스크 폴백이라 상대 경로를 그대로 둔다.
 */
export function publicMediaUrl(url: string): string {
  if (!BLOB_BASE || !url.startsWith(MEDIA_PROXY_PREFIX)) return url;
  // Payload가 encodeURIComponent로 만든 파일명 — Blob 키는 디코드된 원문이다.
  const filename = decodeURIComponent(url.slice(MEDIA_PROXY_PREFIX.length));
  return `${BLOB_BASE}/${encodeURI(filename)}`;
}

/**
 * media 도큐먼트 → Thumbnail.
 * depth:0 조회를 유지하기 위해 media를 따로 읽어 id 맵으로 만들고 여기서 해석한다
 * (depth:1로 올리면 병원·의사·지역 관계까지 전부 populate되어 응답이 부푼다).
 */
export function mapMediaDoc(doc: Raw): Thumbnail | undefined {
  const url = publicMediaUrl(str(doc.url));
  if (!url) return undefined;
  const sizes = (doc.sizes ?? {}) as Record<string, Raw | undefined>;
  const sizeUrl = (name: string): string =>
    publicMediaUrl(str(sizes[name]?.url)) || url;
  return {
    url,
    cardUrl: sizeUrl("card"),
    featureUrl: sizeUrl("feature"),
    alt: str(doc.alt),
    width: optNum(doc.width),
    height: optNum(doc.height),
    // 백필 전 문서는 비어 있다 — 빈 문자열은 넘기지 않는다.
    // next/image는 placeholder="blur"인데 blurDataURL이 falsy면 에러를 던진다.
    blurDataURL: str(doc.blurDataURL) || undefined,
  };
}

/** raw media 배열 → id→Thumbnail 맵 */
export function thumbnailById(docs: Raw[]): Map<DocId, Thumbnail> {
  const map = new Map<DocId, Thumbnail>();
  for (const d of docs) {
    const t = mapMediaDoc(d);
    if (t) map.set(d.id as DocId, t);
  }
  return map;
}

/** raw 도큐먼트 배열 → id→slug 맵 */
export function slugById(docs: Raw[]): Map<DocId, string> {
  return new Map(
    docs.map((d) => [d.id as DocId, typeof d.slug === "string" ? d.slug : String(d.slug ?? "")])
  );
}

// ── 원시값 유틸 ──

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
const dayOnly = (v: unknown): string => {
  const s = str(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

// ── Hospital 계열 ──

export function mapDoctor(d: Raw): Doctor {
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

export function mapHospital(doc: Raw, ctx: HospitalRefContext): Hospital {
  // flat slug 필드는 전부 관계(FK)에서 파생 (M5: 레거시 slug 컬럼 제거 완료)
  const deptFromRel = ctx.departmentSlugById.get(relId(doc.department) ?? "");
  const regionSlugs = deriveRegionSlugs(doc.region, ctx.regionIndex);

  return {
    slug: str(doc.slug),
    nameKr: str(doc.nameKr),
    shortDescription: optStr(doc.shortDescription),
    logo: ctx.thumbnailById.get(relId(doc.logo) ?? ""),
    coverImage: ctx.thumbnailById.get(relId(doc.coverImage) ?? ""),
    departmentSlug: (deptFromRel ?? "") as DepartmentSlug,
    sidoSlug: regionSlugs.sido,
    regionSlug: regionSlugs.gu ?? "",
    dongSlug: regionSlugs.dong,
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
    doctors: ctx.doctorsByHospitalId.get(doc.id as DocId) ?? [],
    prices: Array.isArray(doc.prices) ? (doc.prices as Raw[]).map(mapPrice) : [],
    reviews: Array.isArray(doc.reviews) ? (doc.reviews as Raw[]).map(mapReview) : [],
    phone: optStr(doc.phone),
    hours: mapHours(doc.hours),
  };
}

export function mapDepartment(d: Raw): Department {
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

export function mapRegion(r: Raw, regionIndex: RegionIndex): Region {
  // parentSlug는 관계(parent)에서 파생 (M5: 레거시 parentSlug 컬럼 제거 완료)
  const parentId = relId(r.parent);
  return {
    slug: str(r.slug),
    nameKr: str(r.nameKr),
    nameEn: optStr(r.nameEn),
    level: (optStr(r.level) as RegionLevel | undefined) ?? undefined,
    parentSlug: parentId != null ? regionIndex.get(parentId)?.slug : undefined,
  };
}

// ── Magazine ──

export function mapMagazine(doc: Raw, ctx: MagazineRefContext): Magazine {
  // 링크 slug 필드는 전부 관계(FK)에서 파생 (M5: 레거시 slug 컬럼 제거 완료)
  const linkedHospitalsFromRel = Array.isArray(doc.linkedHospitals)
    ? (doc.linkedHospitals as unknown[])
        .map((v) => ctx.hospitalSlugById.get(relId(v) ?? ""))
        .filter((s): s is string => Boolean(s))
    : undefined;
  const authorFromRel = ctx.doctorSlugById.get(relId(doc.authorDoctor) ?? "");
  const deptFromRel = ctx.departmentSlugById.get(relId(doc.linkedDepartment) ?? "");
  const regionFromRel = ctx.regionSlugById.get(relId(doc.linkedRegion) ?? "");

  return {
    slug: str(doc.slug),
    type: str(doc.type) as MagazineType,
    seoTitle: str(doc.seoTitle),
    metaDescription: str(doc.metaDescription),
    thumbnail: ctx.thumbnailById.get(relId(doc.thumbnail) ?? ""),
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
    linkedHospitalSlugs:
      linkedHospitalsFromRel && linkedHospitalsFromRel.length > 0
        ? linkedHospitalsFromRel
        : undefined,
    linkedDepartmentSlug: deptFromRel || undefined,
    linkedRegionSlug: regionFromRel || undefined,
    linkedTreatmentSlug: optStr(doc.linkedTreatmentSlug),
    authorDoctorSlug: authorFromRel || undefined,
    authorName: optStr(doc.authorName),
    authorTitle: optStr(doc.authorTitle),
    disclaimerType: (str(doc.disclaimerType) || "general") as Magazine["disclaimerType"],
    publishedAt: dayOnly(doc.publishedAt),
    category: str(doc.category),
  };
}

// ── BlogPost (네이버 블로그 이식) ──

export function mapBlogPost(doc: Raw, ctx: MagazineRefContext): BlogPost {
  const hospitalFromRel = ctx.hospitalSlugById.get(relId(doc.hospital) ?? "");
  const authorFromRel = ctx.doctorSlugById.get(relId(doc.authorDoctor) ?? "");

  return {
    slug: str(doc.slug),
    seoTitle: str(doc.seoTitle),
    metaDescription: str(doc.metaDescription),
    thumbnail: ctx.thumbnailById.get(relId(doc.thumbnail) ?? ""),
    shortAnswer: str(doc.shortAnswer),
    body: str(doc.body),
    targetKeywords: strArr(doc.targetKeywords) ?? [],
    faqBlocks: Array.isArray(doc.faqBlocks)
      ? (doc.faqBlocks as Raw[])
          .map((f) => ({ question: str(f.question), answer: str(f.answer) }))
          .filter((f) => f.question && f.answer)
      : undefined,
    hospitalSlug: hospitalFromRel ?? "",
    authorDoctorSlug: authorFromRel || undefined,
    authorName: optStr(doc.authorName),
    authorTitle: optStr(doc.authorTitle),
    sourceBlogName: str(doc.sourceBlogName),
    sourceBlogUrl: str(doc.sourceBlogUrl),
    sourcePosts: Array.isArray(doc.sourcePosts)
      ? (doc.sourcePosts as Raw[])
          .map((p) => ({
            title: str(p.title),
            url: str(p.url),
            postedAt: dayOnly(p.postedAt),
          }))
          .filter((p) => p.title && p.url)
      : [],
    disclaimerType: (str(doc.disclaimerType) || "general") as BlogPost["disclaimerType"],
    publishedAt: dayOnly(doc.publishedAt),
  };
}
