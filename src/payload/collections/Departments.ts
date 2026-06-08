// 진료과 — 정적 `Department` 타입 미러
import type { CollectionConfig } from "payload";

export const Departments: CollectionConfig = {
  slug: "departments",
  admin: {
    useAsTitle: "nameKr",
    group: "마스터 데이터",
    defaultColumns: ["nameKr", "slug", "priority"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text", required: true },
    { name: "nameJp", type: "text" },
    { name: "hanja", type: "text", required: true, admin: { description: "齒, 骨, 眼, 診 등" } },
    { name: "description", type: "textarea", required: true },
    {
      name: "priority",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: { description: "시니어 niche 우선순위 (1=임플란트치과)" },
    },
  ],
};
