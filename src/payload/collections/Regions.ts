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
      name: "parentSlug",
      type: "text",
      index: true,
      admin: { description: "상위 지역 slug (예: seoul). 시/도면 비움." },
    },
  ],
};
