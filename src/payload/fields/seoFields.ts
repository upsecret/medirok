// SEO 공통 필드 — 모든 매거진/Q&A에 사용

import type { Field } from "payload";

export const seoMetaFields: Field[] = [
  {
    name: "seoTitle",
    type: "text",
    required: true,
    maxLength: 60,
    admin: {
      description:
        "H1 + <title>로 사용. 60자 이내. 검색 쿼리·지역·시술 키워드 포함. 예: '강남 임플란트 가격과 의원 선택 기준 (2026)'",
    },
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
    maxLength: 160,
    admin: {
      description:
        "검색 결과 스니펫. 155자 이내. CTR 영향 큼. 행동 유도 단어 포함.",
      rows: 2,
    },
  },
  {
    name: "targetKeywords",
    type: "array",
    labels: { singular: "키워드", plural: "타겟 키워드" },
    admin: {
      description: "1차/2차/롱테일 키워드 분리. 영업한 의원의 타겟 키워드와 매칭.",
    },
    fields: [
      { name: "keyword", type: "text", required: true },
      {
        name: "priority",
        type: "select",
        defaultValue: "secondary",
        options: [
          { label: "1차 (메인)", value: "primary" },
          { label: "2차", value: "secondary" },
          { label: "롱테일", value: "longtail" },
        ],
      },
    ],
  },
  {
    name: "coverImage",
    type: "upload",
    relationTo: "media",
    admin: { description: "OG image 및 대표 이미지" },
  },
];
