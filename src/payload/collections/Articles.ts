// Template 01 — 시술 가이드 (SEO 메인)
// 영업 클라이언트 의원의 시술 키워드 타겟

import type { CollectionConfig } from "payload";
import { seoMetaFields } from "@/payload/fields/seoFields";
import { shortAnswerField, faqBlocksField, priceTableField, stepsField, sourcesField } from "@/payload/fields/aeoFields";
import {
  linkedHospitalsField,
  linkedDepartmentField,
  linkedRegionsField,
  linkedTreatmentsField,
  featuredDoctorField,
} from "@/payload/fields/linkedEntities";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "seoTitle",
    group: "매거진",
    defaultColumns: ["seoTitle", "publishedAt", "linkedDepartment"],
  },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    ...seoMetaFields,
    shortAnswerField,
    {
      name: "body",
      type: "richText",
      required: true,
      admin: { description: "본문. 헤드라인 자연 배치, 키워드 밀도 1~2%" },
    },
    faqBlocksField,
    priceTableField,
    stepsField,
    sourcesField,
    linkedHospitalsField,
    linkedDepartmentField,
    linkedRegionsField,
    linkedTreatmentsField,
    // ★ 의사 저자 — 의원 양방향 cross-link 자동 생성
    // 의원 상세 페이지에 "이 의원 의료진이 쓴 매거진" 섹션에 자동 표시됨
    {
      ...featuredDoctorField,
      name: "authorDoctor",
      label: "저자 (의사)",
      admin: {
        description:
          "★ 의원 의사가 저자인 경우 선택. 매거진 상세에 저자 프로필+의원 cross-link 자동 노출. 메디록 큐레이션팀이 저자인 경우 미선택 + 아래 authorName 사용.",
      },
    },
    {
      name: "authorName",
      type: "text",
      admin: {
        description:
          "authorDoctor 미선택 시에만 사용. 큐레이션팀/외부 전문가 등.",
        condition: (data) => !data?.authorDoctor,
      },
    },
    {
      name: "authorTitle",
      type: "text",
      admin: {
        description: "authorDoctor 미선택 시에만 사용 (예: 전 서울대치과병원 임상조교수)",
        condition: (data) => !data?.authorDoctor,
      },
    },
    disclaimerField,
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: "editor",
      type: "relationship",
      relationTo: "users",
      admin: { description: "발행 담당자 (저자와 무관, 내부 관리용)" },
    },
  ],
};
