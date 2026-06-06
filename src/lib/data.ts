// 메디록 MVP 샘플 데이터
// Phase 1: 강남구 임플란트 치과 시드 데이터
// 실제 운영 시 Prisma DB로 마이그레이션

import type { Department, Region, Hospital, Article } from "@/types";

export const departments: Department[] = [
  {
    slug: "dental",
    nameKr: "치과",
    nameEn: "Dental",
    nameJp: "歯科",
    hanja: "齒",
    description: "임플란트·보철·교정 등 치과 진료",
    priority: 1,
  },
  {
    slug: "orthopedics",
    nameKr: "정형외과",
    nameEn: "Orthopedics",
    nameJp: "整形外科",
    hanja: "骨",
    description: "관절·척추·도수치료 등",
    priority: 2,
  },
  {
    slug: "ophthalmology",
    nameKr: "안과",
    nameEn: "Ophthalmology",
    nameJp: "眼科",
    hanja: "眼",
    description: "백내장·다초점 렌즈·노안 교정",
    priority: 3,
  },
  {
    slug: "obstetrics",
    nameKr: "산부인과",
    nameEn: "Obstetrics",
    nameJp: "産婦人科",
    hanja: "婦",
    description: "여성 검진·임신·갱년기 진료",
    priority: 4,
  },
  {
    slug: "dermatology",
    nameKr: "피부과",
    nameEn: "Dermatology",
    nameJp: "皮膚科",
    hanja: "皮",
    description: "여드름·아토피·피부 진료 (시술 미용 제외)",
    priority: 5,
  },
  {
    slug: "internal-medicine",
    nameKr: "내과",
    nameEn: "Internal Medicine",
    nameJp: "内科",
    hanja: "內",
    description: "갑상선·소화기·만성질환 종합",
    priority: 6,
  },
  {
    slug: "checkup",
    nameKr: "종합검진",
    nameEn: "Checkup",
    nameJp: "健康診断",
    hanja: "診",
    description: "여성·시니어 정기검진",
    priority: 7,
  },
  {
    slug: "cardiology",
    nameKr: "심혈관",
    nameEn: "Cardiology",
    nameJp: "循環器",
    hanja: "心",
    description: "심장·혈관 진료",
    priority: 8,
  },
  {
    slug: "urology",
    nameKr: "비뇨기과",
    nameEn: "Urology",
    nameJp: "泌尿器科",
    hanja: "腎",
    description: "전립선·남성갱년기",
    priority: 9,
  },
];

export const regions: Region[] = [
  { slug: "seoul", nameKr: "서울", nameEn: "Seoul" },
  { slug: "gangnam", nameKr: "강남구", nameEn: "Gangnam-gu", parentSlug: "seoul" },
  { slug: "seocho", nameKr: "서초구", nameEn: "Seocho-gu", parentSlug: "seoul" },
  { slug: "songpa", nameKr: "송파구", nameEn: "Songpa-gu", parentSlug: "seoul" },
  { slug: "yongsan", nameKr: "용산구", nameEn: "Yongsan-gu", parentSlug: "seoul" },
];

export const hospitals: Hospital[] = [
  {
    slug: "hangyeol-dental",
    nameKr: "강남 한결치과의원",
    shortDescription: "齒 임플란트·보철 전문",
    departmentSlug: "dental",
    regionSlug: "gangnam",
    addressLine: "서울 강남구 역삼동 819-3 한결빌딩 5F",
    nearestStation: "2호선 역삼역 3번 출구",
    walkingMinutes: 3,
    rating: 4.9,
    reviewCount: 312,
    yearEstablished: 2014,
    doctorCount: 4,
    monthlyVisitors: 84,
    tier: "PREMIUM",
    tags: ["임플란트", "보철", "교정", "시니어 패키지"],
    phone: "02-555-0123",
    certification: {
      stage1History: true,
      stage1Detail: "12년 운영 · 임플란트 5,200건",
      stage2Reviews: true,
      stage2Detail: "312건 · 영수증 인증 100%",
      stage3Credentials: true,
      stage3Detail: "서울대 치대 졸 · 4인 전문의",
      stage4Facility: true,
      stage4Detail: "3D CT · 위생 1등급",
      certifiedAt: "2026-05",
    },
    curationNote: {
      text: "시니어 임플란트 5,200건의 임상 경험과 3D CT 기반 정밀 진단. 시술 후 평생 보장 시스템은 강남권에서도 손꼽힙니다.",
      curatorName: "박은서",
      curatorTitle: "전 서울대치과병원 임상조교수",
    },
    doctors: [
      {
        slug: "han-jinwoo",
        nameKr: "한진우",
        nameHanja: "韓",
        title: "대표원장",
        yearsExperience: 12,
        specialty: "임플란트·보철",
        credentials: ["서울대학교 치과대학", "치과보철과 전문의"],
      },
      {
        slug: "park-seoyeon",
        nameKr: "박서연",
        nameHanja: "朴",
        title: "부원장",
        yearsExperience: 8,
        specialty: "교정·보철",
      },
      {
        slug: "lee-dohyun",
        nameKr: "이도현",
        nameHanja: "李",
        title: "진료부장",
        yearsExperience: 10,
        specialty: "시니어 임플란트",
      },
      {
        slug: "choi-yerin",
        nameKr: "최예린",
        nameHanja: "崔",
        title: "원장",
        yearsExperience: 7,
        specialty: "심미보철",
      },
    ],
    prices: [
      {
        treatmentName: "임플란트(단일)",
        treatmentNote: "국산 오스템 · 평생 보장",
        normalLow: 640000,
        normalHigh: 850000,
        eventLow: 350000,
        eventHigh: 490000,
        insuranceNote: "65세 이상 보험 적용가 별도",
      },
      {
        treatmentName: "풀마우스 임플란트",
        treatmentNote: "시니어 패키지 할인",
        normalLow: 24000000,
        normalHigh: 30000000,
      },
      {
        treatmentName: "보철·크라운(지르코니아)",
        normalLow: 450000,
        normalHigh: 850000,
      },
    ],
    reviews: [
      {
        id: "rv-001",
        rating: 5,
        content:
          "67세 어머니 풀마우스 했는데 회복 빠르고 한진우 원장님이 정말 자세히 설명해주셨습니다. 시니어 패키지 할인도 받아서 가격도 합리적이었어요.",
        reviewerName: "김OO",
        visitedAt: "2026-05-28",
        treatmentName: "풀마우스 임플란트",
        ageGroup: "60s",
        isReceiptVerified: true,
        isPhoneVerified: true,
      },
      {
        id: "rv-002",
        rating: 5,
        content:
          "임플란트 2개 했는데 4단계 인증 받은 의원이라 믿고 갔어요. 3D CT 결과 자세히 보여주시고 예후도 좋습니다.",
        reviewerName: "이OO",
        visitedAt: "2026-05-21",
        treatmentName: "임플란트(단일)",
        ageGroup: "50s",
        isReceiptVerified: true,
        isPhoneVerified: false,
      },
    ],
    hours: {
      weekday: "09:00 - 18:30",
      saturday: "09:00 - 14:00",
      sunday: "휴진",
      lunch: "13:00 - 14:00",
    },
  },
  {
    slug: "myungheon-dental",
    nameKr: "청담 명헌치과",
    shortDescription: "齒 임플란트·교정",
    departmentSlug: "dental",
    regionSlug: "gangnam",
    addressLine: "서울 강남구 청담동 12-3",
    nearestStation: "7호선 청담역 5번 출구",
    walkingMinutes: 5,
    rating: 4.8,
    reviewCount: 247,
    yearEstablished: 2017,
    doctorCount: 3,
    monthlyVisitors: 30,
    tier: "PREMIUM",
    tags: ["임플란트", "교정"],
    certification: {
      stage1History: true,
      stage1Detail: "9년 운영 · 임플란트 2,800건",
      stage2Reviews: true,
      stage2Detail: "247건 · 영수증 인증",
      stage3Credentials: true,
      stage3Detail: "연세대 치대 졸 · 3인 전문의",
      stage4Facility: true,
      stage4Detail: "3D CT · 위생 1등급",
      certifiedAt: "2026-04",
    },
    doctors: [
      {
        slug: "myungheon-kim",
        nameKr: "김명헌",
        title: "대표원장",
        yearsExperience: 9,
        specialty: "임플란트",
      },
    ],
    prices: [
      {
        treatmentName: "임플란트(단일)",
        normalLow: 520000,
        normalHigh: 890000,
        eventLow: 420000,
        eventHigh: 540000,
      },
    ],
    reviews: [],
  },
  {
    slug: "songhak-dental",
    nameKr: "신사 송학치과",
    shortDescription: "齒 시니어 임플란트 특화",
    departmentSlug: "dental",
    regionSlug: "gangnam",
    addressLine: "서울 강남구 신사동 532-1",
    nearestStation: "3호선 신사역 2번 출구",
    walkingMinutes: 7,
    rating: 4.7,
    reviewCount: 189,
    yearEstablished: 2011,
    doctorCount: 2,
    monthlyVisitors: 11,
    tier: "STANDARD",
    tags: ["임플란트", "시니어"],
    certification: {
      stage1History: true,
      stage1Detail: "15년 운영 · 시니어 임플란트 3,500건",
      stage2Reviews: true,
      stage2Detail: "189건 · 영수증 인증",
      stage3Credentials: true,
      stage3Detail: "치과보철과 전문의 2인",
      stage4Facility: true,
      stage4Detail: "3D CT · 위생 1등급",
      certifiedAt: "2026-03",
    },
    doctors: [
      {
        slug: "songhak-park",
        nameKr: "박송학",
        title: "원장",
        yearsExperience: 15,
        specialty: "시니어 임플란트",
      },
    ],
    prices: [
      {
        treatmentName: "임플란트(단일)",
        normalLow: 490000,
        normalHigh: 529000,
        eventLow: 250000,
        eventHigh: 270000,
      },
    ],
    reviews: [],
  },
  {
    slug: "myungheon-ophthalmology",
    nameKr: "송파 명헌안과",
    shortDescription: "眼 백내장 다초점 렌즈",
    departmentSlug: "ophthalmology",
    regionSlug: "songpa",
    addressLine: "서울 송파구 잠실동 47-15",
    nearestStation: "2호선 잠실역 7번 출구",
    walkingMinutes: 4,
    rating: 4.8,
    reviewCount: 247,
    yearEstablished: 2015,
    doctorCount: 3,
    monthlyVisitors: 42,
    tier: "PREMIUM",
    tags: ["백내장", "다초점렌즈", "노안교정"],
    curationNote: {
      text: "백내장 다초점 렌즈 1,200건. 회복기 관리까지 섬세한 곳.",
      curatorName: "김선우",
    },
    doctors: [],
    prices: [
      {
        treatmentName: "백내장 (다초점 렌즈)",
        normalLow: 2500000,
        normalHigh: 4500000,
      },
    ],
    reviews: [],
  },
  {
    slug: "songhak-orthopedics",
    nameKr: "서초 송학정형외과",
    shortDescription: "骨 척추·관절 전문",
    departmentSlug: "orthopedics",
    regionSlug: "seocho",
    addressLine: "서울 서초구 서초동 1303-22",
    nearestStation: "2호선 강남역 11번 출구",
    walkingMinutes: 6,
    rating: 4.7,
    reviewCount: 189,
    yearEstablished: 2012,
    doctorCount: 5,
    monthlyVisitors: 38,
    tier: "PREMIUM",
    tags: ["척추", "관절", "도수치료", "줄기세포"],
    curationNote: {
      text: "비수술적 척추치료의 정석. 60대 환자 만족도 96%.",
      curatorName: "이지원",
    },
    doctors: [],
    prices: [
      {
        treatmentName: "도수치료 (1회)",
        normalLow: 100000,
        normalHigh: 150000,
      },
    ],
    reviews: [],
  },
];

export const articles: Article[] = [
  {
    slug: "senior-implant-vs-denture",
    title: "시니어 임플란트 vs 틀니, 무엇이 나을까",
    excerpt: "65세 이상 시니어의 의치 선택 기준을 醫錄 전문 큐레이터가 정리했습니다.",
    category: "치과",
    publishedAt: "2026-05-20",
  },
  {
    slug: "implant-price-explained",
    title: "임플란트 평균 가격, 어떻게 결정될까",
    excerpt: "국산·수입 임플란트 브랜드별 가격 차이와 정상가/이벤트가의 의미.",
    category: "가격 가이드",
    publishedAt: "2026-05-14",
  },
  {
    slug: "gangnam-vs-seocho-prices",
    title: "강남 vs 서초 치과, 가격 차이는?",
    excerpt: "지역별 임플란트·보철 평균 가격을 비교 분석합니다.",
    category: "지역 비교",
    publishedAt: "2026-05-08",
  },
];

// ─────────────────────────────────────────────
// 조회 헬퍼
// ─────────────────────────────────────────────

export function getDepartmentBySlug(slug: string) {
  return departments.find((d) => d.slug === slug);
}

export function getRegionBySlug(slug: string) {
  return regions.find((r) => r.slug === slug);
}

export function getHospitalBySlug(slug: string) {
  return hospitals.find((h) => h.slug === slug);
}

export function getHospitalsByDeptAndRegion(deptSlug: string, regionSlug?: string) {
  return hospitals.filter((h) => {
    if (h.departmentSlug !== deptSlug) return false;
    if (regionSlug && h.regionSlug !== regionSlug) return false;
    return true;
  });
}

export function getCurationHospitals(limit = 3) {
  return hospitals
    .filter((h) => h.tier === "PREMIUM" && h.curationNote)
    .slice(0, limit);
}

// 의사 ↔ 의원 양방향 조회
export function getDoctorBySlug(slug: string) {
  for (const h of hospitals) {
    const doc = h.doctors.find((d) => d.slug === slug);
    if (doc) return doc;
  }
  return undefined;
}

export function getHospitalByDoctorSlug(slug: string) {
  return hospitals.find((h) => h.doctors.some((d) => d.slug === slug));
}

export function getDoctorsByHospitalSlug(slug: string) {
  const h = getHospitalBySlug(slug);
  return h?.doctors ?? [];
}

export function formatKRW(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    if (man === Math.floor(man)) return `${man.toLocaleString()}만원`;
    return `${man.toLocaleString()}만`;
  }
  return `${amount.toLocaleString()}원`;
}
