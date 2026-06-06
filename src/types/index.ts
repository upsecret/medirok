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

export interface Region {
  slug: string;
  nameKr: string;
  nameEn?: string;
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
  regionSlug: string;
  addressLine: string;
  nearestStation?: string;
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
