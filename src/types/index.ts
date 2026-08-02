// 메디록 — 핵심 타입 정의

export type HospitalTier = "STANDARD" | "PREMIUM" | "HERITAGE";

export type DepartmentSlug =
  | "dental"
  | "orthopedics"
  | "ophthalmology"
  | "obstetrics"
  | "dermatology"
  | "internal-medicine"
  | "checkup"
  | "cardiology"
  | "urology";

export interface Department {
  slug: DepartmentSlug;
  nameKr: string;
  nameEn: string;
  nameJp?: string;
  hanja: string;
  description: string;
  priority: number;
}

export type RegionLevel = "sido" | "sigungu" | "dong";

export interface Region {
  slug: string;
  nameKr: string;
  nameEn?: string;
  level?: RegionLevel;
  parentSlug?: string;
}

export interface MedirokCertification {
  stage1History: boolean;
  stage1Detail: string;
  stage2Reviews: boolean;
  stage2Detail: string;
  stage3Credentials: boolean;
  stage3Detail: string;
  stage4Facility: boolean;
  stage4Detail: string;
  certifiedAt: string;
}

export interface CurationNote {
  text: string;
  curatorName: string;
  curatorTitle?: string;
}

export interface PriceRange {
  treatmentName: string;
  treatmentNote?: string;
  normalLow: number;
  normalHigh: number;
  eventLow?: number;
  eventHigh?: number;
  insuranceNote?: string;
}

export interface Doctor {
  slug: string;
  nameKr: string;
  nameHanja?: string;
  title: string;
  yearsExperience: number;
  specialty?: string;
  credentials?: string[];
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  reviewerName: string;
  visitedAt: string;
  treatmentName?: string;
  ageGroup?: string;
  isReceiptVerified: boolean;
  isPhoneVerified: boolean;
}

export interface Hospital {
  slug: string;
  nameKr: string;
  shortDescription?: string;
  /** 의원 로고. 파생 사이즈(16:9 크롭)가 아니라 원본 url을 쓴다 */
  logo?: Thumbnail;
  departmentSlug: DepartmentSlug;
  /** 시/도 slug (예: 인천). URL·지역 필터의 상위 스코프 — 구 이름 충돌 방지용 */
  sidoSlug?: string;
  regionSlug: string;
  /** 동(읍/면/동) slug — 선택. 병원 목록의 동 필터용 */
  dongSlug?: string;
  addressLine: string;
  nearestStation?: string;
  /** 가장 가까운 지하철역명(역주변 필터용, 예: "아라역") — stations.ts의 역 slug와 매칭 */
  nearestStationName?: string;
  walkingMinutes?: number;
  rating: number;
  reviewCount: number;
  yearEstablished?: number;
  doctorCount: number;
  monthlyVisitors?: number;
  tier: HospitalTier;
  tags?: string[];
  certification?: MedirokCertification;
  curationNote?: CurationNote;
  doctors: Doctor[];
  prices: PriceRange[];
  reviews: Review[];
  phone?: string;
  hours?: {
    weekday: string;
    saturday?: string;
    sunday?: string;
    lunch?: string;
  };
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
}

// ── 매거진 (구 src/lib/magazines.ts에서 이동) ──

export type MagazineType = "article" | "qna" | "regional" | "interview" | "case";

/**
 * 업로드된 대표 이미지 (Payload media).
 * 용도별로 다른 파생 사이즈를 쓴다 — 카드는 card(768×432), 상세 히어로와 OG는
 * feature(1280×720). sharp가 만들지 못한 사이즈는 원본(url)으로 폴백한다.
 */
export interface Thumbnail {
  url: string;
  cardUrl: string;
  featureUrl: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Magazine {
  slug: string;
  type: MagazineType;
  seoTitle: string;
  metaDescription: string;
  thumbnail?: Thumbnail;
  shortAnswer: string;
  body: string; // Markdown
  targetKeywords: string[];
  faqBlocks?: { question: string; answer: string }[];
  priceTable?: { treatment: string; priceRange: string; note?: string }[];
  linkedHospitalSlugs?: string[];
  linkedDepartmentSlug?: string;
  linkedRegionSlug?: string;
  linkedTreatmentSlug?: string;
  /** 저자 = 메디록 인증 의원의 의사. 설정 시 author 프로필 박스 + 의원 cross-link 자동 노출 */
  authorDoctorSlug?: string;
  /** authorDoctorSlug가 없을 때 사용 (메디록 큐레이션팀, 외부 전문가 등) */
  authorName?: string;
  authorTitle?: string;
  disclaimerType: "general" | "case" | "price" | "qna";
  publishedAt: string;
  category: string;
}

// ─────────────────────────────────────────────
// 병원 블로그 — 네이버 블로그 이식 (enterprise)
// ─────────────────────────────────────────────

/** 재구성의 근거가 된 네이버 블로그 원문 1건 */
export interface BlogSourcePost {
  title: string;
  url: string;
  /** 네이버 원문 게시일 (YYYY-MM-DD) */
  postedAt: string;
}

export interface BlogPost {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  thumbnail?: Thumbnail;
  shortAnswer: string;
  body: string; // Markdown
  targetKeywords: string[];
  faqBlocks?: { question: string; answer: string }[];
  /** 블로그 소유 병원 — URL 1단계이자 그룹핑 키 */
  hospitalSlug: string;
  authorDoctorSlug?: string;
  authorName?: string;
  authorTitle?: string;
  sourceBlogName: string;
  sourceBlogUrl: string;
  /** 최소 1건. 이 글이 종합한 원문 전체 */
  sourcePosts: BlogSourcePost[];
  disclaimerType: "general" | "case" | "price" | "qna";
  publishedAt: string;
}
