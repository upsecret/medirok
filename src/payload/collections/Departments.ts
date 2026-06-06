import type { CollectionConfig } from "payload";

export const Departments: CollectionConfig = {
  slug: "departments",
  admin: { useAsTitle: "nameKr", group: "마스터 데이터" },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text", required: true },
    { name: "nameJp", type: "text" },
    { name: "hanja", type: "text", admin: { description: "齒, 骨, 眼, 診 등" } },
    { name: "description", type: "textarea" },
    {
      name: "priority",
      type: "number",
      defaultValue: 0,
      admin: { description: "시니어 niche 우선순위 (1=임플란트치과)" },
    },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
