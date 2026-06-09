// 지역 — 정적 `Region` 타입 미러 (parentSlug 기반)
import type { CollectionConfig } from "payload";

export const Regions: CollectionConfig = {
  slug: "regions",
  admin: {
    useAsTitle: "nameKr",
    group: "마스터 데이터",
    defaultColumns: ["nameKr", "slug", "parentSlug"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text" },
    {
      name: "level",
      type: "select",
      index: true,
      options: [
        { label: "시/도", value: "sido" },
        { label: "시/군/구", value: "sigungu" },
        { label: "읍/면/동", value: "dong" },
      ],
      admin: { description: "지역 depth (시도 → 시군구 → 동)" },
    },
    {
      name: "parentSlug",
      type: "text",
      index: true,
      admin: { description: "상위 지역 slug (예: 강남구→seoul, 역삼동→gangnam). 시/도면 비움." },
    },
  ],
};
