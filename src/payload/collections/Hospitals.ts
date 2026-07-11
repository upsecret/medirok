// 의원 — 단일 통합 컬렉션
// 프론트엔드 flat `Hospital` 타입(src/types)을 그대로 미러링.
// 가격·리뷰·인증·진료시간은 임베드, 진료과/지역은 관계(FK), 의사는 doctors 컬렉션.
// /admin 단일 관리.

import type { CollectionConfig } from "payload";

export const Hospitals: CollectionConfig = {
  slug: "hospitals",
  admin: {
    useAsTitle: "nameKr",
    group: "의원",
    defaultColumns: ["nameKr", "tier", "department", "region", "rating"],
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.slug) data.slug = String(data.slug).trim().toLowerCase();
        return data;
      },
    ],
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nameKr", type: "text", required: true },
    { name: "shortDescription", type: "text" },
    // ── 관계 (slug→FK 전환 완료: 레거시 slug 텍스트 필드는 M5에서 제거) ──
    {
      name: "department",
      type: "relationship",
      relationTo: "departments",
      required: true,
      index: true,
      admin: { description: "진료과 참조" },
    },
    {
      name: "region",
      type: "relationship",
      relationTo: "regions",
      required: true,
      index: true,
      admin: {
        description:
          "최하위 지역 참조 (동이 있으면 동, 없으면 시군구). 상위 지역은 region.parent 체인으로 해석",
      },
    },
    { name: "addressLine", type: "text", required: true },
    { name: "nearestStation", type: "text" },
    {
      name: "nearestStationName",
      type: "text",
      index: true,
      admin: { description: "가장 가까운 지하철역명 (역주변 필터용, 예: 아라역)" },
    },
    { name: "walkingMinutes", type: "number" },
    {
      name: "tier",
      type: "select",
      required: true,
      defaultValue: "STANDARD",
      options: [
        { label: "STANDARD (일반 인증)", value: "STANDARD" },
        { label: "PREMIUM (큐레이션)", value: "PREMIUM" },
        { label: "HERITAGE (장기·우수)", value: "HERITAGE" },
      ],
    },
    { name: "phone", type: "text" },
    { name: "yearEstablished", type: "number" },
    // 통계 (flat — 프론트가 h.rating 등으로 직접 접근)
    { name: "rating", type: "number", min: 0, max: 5, required: true, defaultValue: 0 },
    { name: "reviewCount", type: "number", required: true, defaultValue: 0 },
    { name: "doctorCount", type: "number", required: true, defaultValue: 0 },
    { name: "monthlyVisitors", type: "number" },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      admin: { description: "태그 (예: 임플란트, 보철)" },
    },
    // 메디록 4단계 인증
    {
      name: "certification",
      type: "group",
      label: "메디록 4단계 인증",
      fields: [
        { name: "stage1History", type: "checkbox", label: "01 진료이력 통과" },
        { name: "stage1Detail", type: "text" },
        { name: "stage2Reviews", type: "checkbox", label: "02 실방문 후기 통과" },
        { name: "stage2Detail", type: "text" },
        { name: "stage3Credentials", type: "checkbox", label: "03 의료진 통과" },
        { name: "stage3Detail", type: "text" },
        { name: "stage4Facility", type: "checkbox", label: "04 시설·장비 통과" },
        { name: "stage4Detail", type: "text" },
        { name: "certifiedAt", type: "text", admin: { description: "예: 2026-05" } },
      ],
    },
    // 큐레이터 노트 (PREMIUM 전용)
    {
      name: "curationNote",
      type: "group",
      label: "큐레이터 노트 (PREMIUM 전용)",
      admin: { condition: (data) => data?.tier === "PREMIUM" },
      fields: [
        { name: "text", type: "textarea", maxLength: 300 },
        { name: "curatorName", type: "text" },
        { name: "curatorTitle", type: "text" },
      ],
    },
    // 의료진 — doctors 컬렉션으로 승격됨 (doctors.hospital 관계로 소속 표현)
    // 시술별 가격 (임베드)
    {
      name: "prices",
      type: "array",
      label: "시술별 가격",
      fields: [
        { name: "treatmentName", type: "text", required: true },
        { name: "treatmentNote", type: "text" },
        { name: "normalLow", type: "number", required: true },
        { name: "normalHigh", type: "number", required: true },
        { name: "eventLow", type: "number" },
        { name: "eventHigh", type: "number" },
        { name: "insuranceNote", type: "text" },
      ],
    },
    // 리뷰 (임베드)
    {
      name: "reviews",
      type: "array",
      label: "리뷰",
      fields: [
        { name: "id", type: "text" },
        { name: "rating", type: "number", min: 0, max: 5 },
        { name: "content", type: "textarea" },
        { name: "reviewerName", type: "text" },
        { name: "visitedAt", type: "text" },
        { name: "treatmentName", type: "text" },
        { name: "ageGroup", type: "text" },
        { name: "isReceiptVerified", type: "checkbox" },
        { name: "isPhoneVerified", type: "checkbox" },
      ],
    },
    // 진료시간
    {
      name: "hours",
      type: "group",
      fields: [
        { name: "weekday", type: "text" },
        { name: "saturday", type: "text" },
        { name: "sunday", type: "text" },
        { name: "lunch", type: "text" },
      ],
    },
  ],
};
