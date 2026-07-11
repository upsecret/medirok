// 의사 — 독립 컬렉션 (구 hospitals.doctors 임베드 배열에서 승격)
// slug→FK 전환(docs/db-reference-migration-plan.md) M1에서 신설.
// 매거진 저자(magazines.authorDoctor)가 이 컬렉션을 참조한다.

import type { CollectionConfig } from "payload";

export const Doctors: CollectionConfig = {
  slug: "doctors",
  admin: {
    useAsTitle: "nameKr",
    group: "의원",
    defaultColumns: ["nameKr", "title", "hospital"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "nameKr", type: "text", required: true },
    { name: "nameHanja", type: "text", admin: { description: "한자 1자 (아바타용)" } },
    { name: "title", type: "text", admin: { description: "대표원장 / 부원장 등" } },
    { name: "yearsExperience", type: "number" },
    { name: "specialty", type: "text" },
    { name: "credentials", type: "text", hasMany: true },
    {
      name: "hospital",
      type: "relationship",
      relationTo: "hospitals",
      index: true,
      admin: { description: "소속 의원" },
    },
  ],
};
