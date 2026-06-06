// Template 02 — Q&A 의사 답변 (AEO 핵심)

import type { CollectionConfig } from "payload";
import { seoMetaFields } from "@/payload/fields/seoFields";
import { shortAnswerField, sourcesField } from "@/payload/fields/aeoFields";
import {
  linkedHospitalsField,
  linkedDepartmentField,
  featuredDoctorField,
} from "@/payload/fields/linkedEntities";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const QnAs: CollectionConfig = {
  slug: "qnas",
  admin: {
    useAsTitle: "question",
    group: "매거진",
    defaultColumns: ["question", "featuredDoctor", "publishedAt"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "question",
      type: "text",
      required: true,
      admin: { description: "검색 사용자 실제 쿼리 패턴. H1 + <title>로 사용." },
    },
    shortAnswerField,
    {
      name: "detailedAnswer",
      type: "richText",
      required: true,
      admin: { description: "3~5문단. 근거·예시·주의사항 포함." },
    },
    ...seoMetaFields.filter((f) => f.name !== "seoTitle"),
    featuredDoctorField,
    linkedHospitalsField,
    linkedDepartmentField,
    sourcesField,
    disclaimerField,
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
};
