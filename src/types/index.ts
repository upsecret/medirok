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

export interface Magazine {
  slug: string;
  type: MagazineType;
  seoTitle: string;
  metaDescription: string;
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
