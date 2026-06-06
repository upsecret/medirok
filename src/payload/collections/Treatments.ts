import type { CollectionConfig } from "payload";

export const Treatments: CollectionConfig = {
  slug: "treatments",
  admin: { useAsTitle: "nameKr", group: "마스터 데이터" },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text" },
    {
      name: "department",
      type: "relationship",
      relationTo: "departments",
      required: true,
    },
    { name: "description", type: "textarea" },
    { name: "avgPriceLow", type: "number" },
    { name: "avgPriceHigh", type: "number" },
    { name: "isCovered", type: "checkbox", defaultValue: false, label: "보험 적용" },
    { name: "isSeniorTarget", type: "checkbox", defaultValue: true },
  ],
};
