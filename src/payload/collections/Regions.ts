import type { CollectionConfig } from "payload";

export const Regions: CollectionConfig = {
  slug: "regions",
  admin: { useAsTitle: "nameKr", group: "마스터 데이터" },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameEn", type: "text" },
    {
      name: "level",
      type: "select",
      required: true,
      options: [
        { label: "시도", value: "SIDO" },
        { label: "시군구", value: "SIGUNGU" },
        { label: "동/읍/면", value: "DONG" },
      ],
    },
    {
      name: "parent",
      type: "relationship",
      relationTo: "regions",
    },
    { name: "latitude", type: "number" },
    { name: "longitude", type: "number" },
  ],
};
