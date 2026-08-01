// 이미지 업로드 — 매거진·블로그 썸네일의 저장소.
//
// 파일 실체는 Vercel Blob에 올라간다(payload.config.ts의 vercelBlobStorage).
// staticDir은 토큰이 없는 환경(e2e docker, 로컬)의 폴백 경로로만 쓰인다.
//
// 차용 이미지가 섞이므로 출처를 문서에 남긴다 — 이 프로젝트가 블로그 본문에
// sourcePosts를 강제하는 것과 같은 이유다.

import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "미디어",
    useAsTitle: "alt",
    defaultColumns: ["filename", "alt", "credit"],
  },
  access: { read: () => true },
  upload: {
    staticDir: "media",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 432, position: "centre" },
      { name: "feature", width: 1280, height: 720, position: "centre" },
    ],
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "대체 텍스트. 스크린리더와 검색엔진이 읽는다." },
    },
    { name: "caption", type: "text" },
    {
      name: "credit",
      type: "text",
      admin: {
        description: '차용 이미지의 저작권자. 예: "예온치과병원 공식 홈페이지"',
      },
    },
    {
      name: "sourceUrl",
      type: "text",
      admin: { description: "원본 이미지가 게시된 페이지 URL" },
    },
  ],
};
