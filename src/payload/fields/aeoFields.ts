// AEO (Answer Engine Optimization) 공통 필드
// LLM 검색(ChatGPT, Perplexity, Google AI Overview) 노출 최적화

import type { Field } from "payload";

/**
 * 핵심 필드. LLM이 그대로 인용하는 1~2문장 답변.
 * 200자 이내 권장.
 */
export const shortAnswerField: Field = {
  name: "shortAnswer",
  type: "textarea",
  required: true,
  maxLength: 240,
  admin: {
    description:
      "★ AEO 핵심 필드. ChatGPT·Perplexity·Google AI가 그대로 인용할 1~2문장 답변. 200자 이내. 출처(메디록, 발행연월) 포함 권장.",
    rows: 3,
  },
};

/**
 * FAQ 블록 — FAQPage schema 자동 생성
 */
export const faqBlocksField: Field = {
  name: "faqBlocks",
  type: "array",
  labels: { singular: "Q&A", plural: "Q&A 블록" },
  admin: {
    description:
      "★ AEO: FAQPage schema 자동 출력. 각 Q&A는 LLM 답변에 직접 노출됨.",
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      admin: { description: "검색 사용자 실제 쿼리 패턴으로 작성" },
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
      maxLength: 500,
      admin: { description: "250~500자. 출처/숫자/연월 포함" },
    },
  ],
};

/**
 * 가격 비교 표 — AI가 인용하기 좋은 구조
 */
export const priceTableField: Field = {
  name: "priceTable",
  type: "array",
  labels: { singular: "가격 행", plural: "가격 비교 표" },
  admin: {
    description: "AI 답변에 표/리스트 형식으로 인용됨",
  },
  fields: [
    { name: "treatment", type: "text", required: true },
    { name: "priceRange", type: "text", required: true },
    { name: "note", type: "text" },
  ],
};

/**
 * 단계 가이드 (HowTo schema 후보)
 */
export const stepsField: Field = {
  name: "steps",
  type: "array",
  labels: { singular: "단계", plural: "단계별 가이드" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
  ],
};

/**
 * 출처/참고문헌 — E-E-A-T 강화
 */
export const sourcesField: Field = {
  name: "sources",
  type: "array",
  labels: { singular: "출처", plural: "출처·참고문헌" },
  admin: {
    description: "논문·가이드라인·공식 통계. E-E-A-T 강화.",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "url", type: "text" },
    { name: "year", type: "number" },
  ],
};
