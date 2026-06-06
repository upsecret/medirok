// Template 05 — 케이스 스토리 (전환 직격)
// 실제 환자 시술 결과. 의원 동의서 필수.

import type { CollectionConfig } from "payload";
import { seoMetaFields } from "@/payload/fields/seoFields";
import { shortAnswerField, stepsField } from "@/payload/fields/aeoFields";
import { linkedDepartmentField, featuredDoctorField } from "@/payload/fields/linkedEntities";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const CaseStories: CollectionConfig = {
  slug: "case-stories",
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
      name: "consentReceived",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: {
        description:
          "★ 환자/의원 게재 동의서 받았는가? 미체크 시 발행 차단.",
      },
    },
    {
      name: "patientAge",
      type: "number",
      admin: { description: "익명 처리. 연령만 표시." },
    },
    { name: "patientCondition", type: "text" },
    {
      name: "treatmentPath",
      type: "blocks",
      blocks: [
        {
          slug: "step",
          fields: [
            { name: "title", type: "text", required: true },
            { name: "description", type: "textarea", required: true },
            { name: "image", type: "upload", relationTo: "media" },
          ],
        },
      ],
    },
    {
      name: "beforeAfter",
      type: "group",
      fields: [
        { name: "before", type: "upload", relationTo: "media" },
        { name: "after", type: "upload", relationTo: "media" },
      ],
      admin: { description: "전후 사진 (동의 필수)" },
    },
    {
      name: "featuredHospital",
      type: "relationship",
      relationTo: "hospitals",
      required: true,
    },
    featuredDoctorField,
    linkedDepartmentField,
    {
      name: "outcome",
      type: "group",
      fields: [
        { name: "result", type: "textarea" },
        { name: "totalCost", type: "text" },
        { name: "durationDays", type: "number" },
      ],
    },
    stepsField,
    {
      name: "disclaimerType",
      type: "select",
      required: true,
      defaultValue: "case",
      options: [
        { label: "케이스 스토리 (시술 후기)", value: "case" },
      ],
      admin: {
        description: "케이스 스토리는 자동으로 케이스 disclaimer 사용",
        readOnly: true,
      },
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
};
