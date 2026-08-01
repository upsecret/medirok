// 병원 블로그 — 네이버 블로그 콘텐츠 이식 (enterprise)
//
// 병원 공식 네이버 블로그의 포스팅을 AEO/GEO 형식으로 재구성해 메디록에 싣는다.
// 네이버 원본은 그대로 두고 메디록이 원출처를 명시한다(sourcePosts).
// 한 편은 여러 원문의 종합이므로 sourcePosts는 배열이며 최소 1건 필수.
//
// 매거진과 분리한 이유: IA(병원 단위 그룹핑)와 카드 의미가 다르고,
// magazines-data의 in-memory 조회에 섞이면 기존 관련글/카테고리 로직을 전부 오염시킨다.

import type { CollectionConfig } from "payload";
import { disclaimerField } from "@/payload/fields/medicalDisclaimer";

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  admin: {
    useAsTitle: "seoTitle",
    group: "블로그",
    defaultColumns: ["seoTitle", "hospital", "publishedAt"],
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.slug) data.slug = String(data.slug).trim().toLowerCase();
        return data;
      },
    ],
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "seoTitle", type: "text", required: true },
    { name: "metaDescription", type: "textarea", required: true },
    {
      // 원문 네이버 블로그에서 고른 대표 이미지. 출처는 media.credit/sourceUrl에 남긴다.
      name: "thumbnail",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "대표 이미지 (16:9 권장). 원문 블로그에서 선정.",
      },
    },
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
          "본문 (마크다운). 질문형 ## 제목 권장. 이미지는 사용하지 않는다(v1 텍스트 전용).",
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
    // ── 관계 ──
    {
      name: "hospital",
      type: "relationship",
      relationTo: "hospitals",
      required: true,
      index: true,
      admin: { description: "블로그 소유 병원 (URL 1단계에 사용)" },
    },
    {
      name: "authorDoctor",
      type: "relationship",
      relationTo: "doctors",
      admin: {
        description: "원문 저자가 의사인 경우 지정. 설정 시 저자 프로필 노출.",
      },
    },
    {
      name: "authorName",
      type: "text",
      admin: { description: "authorDoctor 미설정 시 사용" },
    },
    { name: "authorTitle", type: "text" },
    // ── 원출처 (필수) ──
    {
      name: "sourceBlogName",
      type: "text",
      required: true,
      admin: { description: '예: "예온치과병원 공식 블로그"' },
    },
    {
      name: "sourceBlogUrl",
      type: "text",
      required: true,
      admin: { description: "네이버 블로그 루트 URL" },
    },
    {
      name: "sourcePosts",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "원문", plural: "참조 원문" },
      admin: { description: "이 글이 재구성한 네이버 블로그 원문 전체" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "url", type: "text", required: true },
        {
          name: "postedAt",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
            description: "네이버 원문 게시일",
          },
        },
      ],
    },
    disclaimerField,
    {
      name: "publishedAt",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" } },
    },
  ],
};
