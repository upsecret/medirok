import type { CollectionConfig } from "payload";

export const Hospitals: CollectionConfig = {
  slug: "hospitals",
  admin: {
    useAsTitle: "nameKr",
    group: "의원·의사",
    defaultColumns: ["nameKr", "tier", "department", "region", "rating"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text" },
    { name: "shortDescription", type: "text" },
    {
      name: "tier",
      type: "select",
      required: true,
      defaultValue: "STANDARD",
      options: [
        { label: "STANDARD (일반 인증)", value: "STANDARD" },
        { label: "PREMIUM (큐레이션 + 유료 파트너)", value: "PREMIUM" },
        { label: "HERITAGE (장기 + 우수)", value: "HERITAGE" },
      ],
      admin: { description: "★ TIER 1(큐레이션) vs TIER 2(일반) 결정" },
    },
    {
      name: "department",
      type: "relationship",
      relationTo: "departments",
      required: true,
    },
    {
      name: "region",
      type: "relationship",
      relationTo: "regions",
      required: true,
    },
    { name: "addressLine", type: "text", required: true },
    { name: "nearestStation", type: "text" },
    { name: "walkingMinutes", type: "number" },
    { name: "phone", type: "text" },
    { name: "yearEstablished", type: "number" },

    // 메디록 4단계 인증
    {
      name: "certification",
      type: "group",
      label: "메디록 4단계 인증",
      fields: [
        { name: "stage1Detail", type: "text", label: "01 진료이력" },
        { name: "stage2Detail", type: "text", label: "02 실방문 후기" },
        { name: "stage3Detail", type: "text", label: "03 의료진" },
        { name: "stage4Detail", type: "text", label: "04 시설·장비" },
        { name: "certifiedAt", type: "date" },
      ],
    },

    // 큐레이터 노트 (PREMIUM만)
    {
      name: "curationNote",
      type: "group",
      label: "큐레이터 노트 (PREMIUM 전용)",
      admin: { condition: (data) => data?.tier === "PREMIUM" },
      fields: [
        { name: "text", type: "textarea", maxLength: 200 },
        { name: "curatorName", type: "text" },
        { name: "curatorTitle", type: "text" },
      ],
    },

    // 시술 가격 (의원별)
    {
      name: "prices",
      type: "array",
      label: "시술별 가격",
      fields: [
        {
          name: "treatment",
          type: "relationship",
          relationTo: "treatments",
          required: true,
        },
        { name: "normalLow", type: "number", required: true },
        { name: "normalHigh", type: "number", required: true },
        { name: "eventLow", type: "number" },
        { name: "eventHigh", type: "number" },
        { name: "note", type: "text" },
      ],
    },

    // 통계 (캐시)
    {
      name: "stats",
      type: "group",
      fields: [
        { name: "rating", type: "number", min: 0, max: 5 },
        { name: "reviewCount", type: "number", defaultValue: 0 },
        { name: "doctorCount", type: "number", defaultValue: 0 },
        { name: "monthlyVisitors", type: "number", defaultValue: 0 },
      ],
    },

    { name: "tags", type: "array", fields: [{ name: "tag", type: "text" }] },
    { name: "isActive", type: "checkbox", defaultValue: true },
    {
      name: "isPartner",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "SEO/AEO 영업 계약 의원" },
    },
  ],
};
