// Template 04 — 의원 인터뷰 (E-E-A-T + 자연 백링크)

import type { CollectionConfig } from "payload";
import { seoMetaFields } from "@/payload/fields/seoFields";
import { shortAnswerField, sourcesField } from "@/payload/fields/aeoFields";
import { linkedDepartmentField } from "@/payload/fields/linkedEntities";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const HospitalInterviews: CollectionConfig = {
  slug: "hospital-interviews",
  admin: {
    useAsTitle: "seoTitle",
    group: "매거진",
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    ...seoMetaFields,
    shortAnswerField,
    {
      name: "featuredHospital",
      type: "relationship",
      relationTo: "hospitals",
      required: true,
      admin: { description: "★ 큐레이션 의원 (PREMIUM 추천)" },
    },
    {
      name: "interviewedDoctor",
      type: "relationship",
      relationTo: "doctors",
      required: true,
    },
    {
      name: "qaBlocks",
      type: "array",
      label: "인터뷰 Q&A",
      minRows: 5,
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "caseStudies",
      type: "array",
      label: "시술 사례 (간단)",
      fields: [
        { name: "patientProfile", type: "text" },
        { name: "treatment", type: "text" },
        { name: "outcome", type: "textarea" },
      ],
    },
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
