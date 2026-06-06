import type { CollectionConfig } from "payload";

export const Doctors: CollectionConfig = {
  slug: "doctors",
  admin: { useAsTitle: "nameKr", group: "의원·의사" },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameHanja", type: "text", admin: { description: "한자 1자 (아바타용)" } },
    { name: "title", type: "text", admin: { description: "원장 / 부원장" } },
    {
      name: "hospital",
      type: "relationship",
      relationTo: "hospitals",
      required: true,
    },
    { name: "specialty", type: "text" },
    { name: "yearsExperience", type: "number" },
    { name: "bio", type: "textarea", admin: { description: "의원 페이지·매거진 저자 박스에 노출되는 소개" } },
    {
      name: "magazineAuthorBio",
      type: "text",
      maxLength: 80,
      admin: {
        description:
          "매거진 저자 박스 짧은 한 줄 (예: '시니어 임플란트 12년차 · 5,200건 시술')",
      },
    },
    { name: "photo", type: "upload", relationTo: "media" },
    {
      name: "credentials",
      type: "array",
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "학력", value: "education" },
            { label: "전문의 자격", value: "certification" },
            { label: "수상·논문", value: "award" },
          ],
        },
        { name: "title", type: "text", required: true },
        { name: "year", type: "number" },
      ],
    },
  ],
};
