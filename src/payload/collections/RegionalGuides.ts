// Template 03 — 지역 가이드 (Local SEO)
// "강남 임플란트 의원 추천 TOP 10" 패턴

import type { CollectionConfig } from "payload";
import { seoMetaFields } from "@/payload/fields/seoFields";
import { shortAnswerField, faqBlocksField } from "@/payload/fields/aeoFields";
import {
  linkedRegionsField,
  linkedDepartmentField,
  linkedTreatmentsField,
} from "@/payload/fields/linkedEntities";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const RegionalGuides: CollectionConfig = {
  slug: "regional-guides",
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
      name: "intro",
      type: "textarea",
      required: true,
      maxLength: 400,
      admin: { description: "300자 인트로 (지역+시술 개요)" },
    },
    {
      name: "hospitalsRanked",
      type: "array",
      label: "랭킹 의원",
      required: true,
      minRows: 3,
      admin: { description: "큐레이션 의원이 상위 노출되도록 정렬" },
      fields: [
        {
          name: "hospital",
          type: "relationship",
          relationTo: "hospitals",
          required: true,
        },
        {
          name: "selectionReason",
          type: "textarea",
          maxLength: 200,
          admin: { description: "이 의원이 선정된 이유 (큐레이터 코멘트)" },
        },
      ],
    },
    {
      name: "pricesAvg",
      type: "group",
      label: "지역 평균 가격",
      fields: [
        { name: "low", type: "number" },
        { name: "high", type: "number" },
        { name: "currency", type: "text", defaultValue: "KRW" },
      ],
    },
    faqBlocksField,
    linkedRegionsField,
    linkedDepartmentField,
    linkedTreatmentsField,
    {
      name: "authorDoctor",
      type: "relationship",
      relationTo: "doctors",
      label: "저자 (의사, 선택)",
      admin: {
        description:
          "지역 가이드는 보통 메디록 큐레이션팀이 작성. 특정 의원 의사가 작성한 경우 선택.",
      },
    },
    {
      name: "authorName",
      type: "text",
      admin: { condition: (data) => !data?.authorDoctor },
    },
    {
      name: "authorTitle",
      type: "text",
      admin: { condition: (data) => !data?.authorDoctor },
    },
    disclaimerField,
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
};
