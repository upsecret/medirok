// 메디록 매거진 — 단일 통합 컬렉션
// 프론트엔드의 flat `Magazine` 인터페이스(src/lib/magazines.ts)를 그대로 미러링.
// body는 마크다운 textarea, 링크는 slug 텍스트(정적 병원/의사 데이터와 매칭).
// /admin 단일 관리, loadMagazines 계열이 이 컬렉션을 조회.

import type { CollectionConfig } from "payload";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

const TYPE_OPTIONS = [
  { label: "시술 가이드", value: "article" },
  { label: "Q&A", value: "qna" },
  { label: "지역 가이드", value: "regional" },
  { label: "의원 인터뷰", value: "interview" },
  { label: "케이스 스토리", value: "case" },
] as const;

const TYPE_CATEGORY: Record<string, string> = {
  article: "시술 가이드",
  qna: "Q&A",
  regional: "지역 가이드",
  interview: "의원 인터뷰",
  case: "케이스 스토리",
};

export const Magazines: CollectionConfig = {
  slug: "magazines",
  admin: {
    useAsTitle: "seoTitle",
    group: "매거진",
    defaultColumns: ["seoTitle", "type", "publishedAt"],
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.slug) data.slug = String(data.slug).trim().toLowerCase();
        if (!data?.category && data?.type) data.category = TYPE_CATEGORY[data.type];
        return data;
      },
    ],
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "article",
      options: TYPE_OPTIONS as unknown as { label: string; value: string }[],
    },
    { name: "seoTitle", type: "text", required: true },
    { name: "metaDescription", type: "textarea", required: true },
    {
      name: "shortAnswer",
      type: "textarea",
      required: true,
      admin: { description: "AEO용 핵심 답변 (요약 박스에 노출)" },
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      admin: {
        description:
          "본문 (마크다운). ## 제목, **Q. 질문**, - 리스트, | 표 형식 지원.",
      },
    },
    {
      name: "targetKeywords",
      type: "text",
      hasMany: true,
      admin: { description: "타겟 키워드 (여러 개 입력)" },
    },
    {
      name: "faqBlocks",
      type: "array",
      labels: { singular: "FAQ", plural: "FAQ" },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "priceTable",
      type: "array",
      labels: { singular: "가격 행", plural: "가격표" },
      fields: [
        { name: "treatment", type: "text", required: true },
        { name: "priceRange", type: "text", required: true },
        { name: "note", type: "text" },
      ],
    },
    // ── 관계 (slug→FK 전환 완료: 레거시 slug 텍스트 필드는 M5에서 제거) ──
    {
      name: "linkedHospitals",
      type: "relationship",
      relationTo: "hospitals",
      hasMany: true,
      admin: { description: "연결할 병원" },
    },
    {
      name: "linkedDepartment",
      type: "relationship",
      relationTo: "departments",
      admin: { description: "연결 진료과" },
    },
    {
      name: "linkedRegion",
      type: "relationship",
      relationTo: "regions",
      admin: { description: "연결 지역" },
    },
    {
      name: "authorDoctor",
      type: "relationship",
      relationTo: "doctors",
      index: true,
      admin: {
        description: "의사 저자. 설정 시 저자 프로필 + 의원 cross-link 자동 노출.",
      },
    },
    {
      name: "linkedTreatmentSlug",
      type: "text",
      admin: { description: "연결 시술 slug (시술 컬렉션 도입 전까지 텍스트 유지)" },
    },
    {
      name: "authorName",
      type: "text",
      admin: {
        description: "authorDoctor 미설정 시 사용 (큐레이션팀/외부 전문가).",
      },
    },
    { name: "authorTitle", type: "text" },
    disclaimerField,
    {
      name: "publishedAt",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" } },
    },
    {
      name: "category",
      type: "text",
      admin: { description: "미입력 시 타입에서 자동 설정." },
    },
  ],
};
