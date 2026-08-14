// 이미지 업로드 — 매거진·블로그 썸네일의 저장소.
//
// 파일 실체는 Vercel Blob에 올라간다(payload.config.ts의 vercelBlobStorage).
// staticDir은 토큰이 없는 환경(e2e docker, 로컬)의 폴백 경로로만 쓰인다.
//
// 차용 이미지가 섞이므로 출처를 문서에 남긴다 — 이 프로젝트가 블로그 본문에
// sourcePosts를 강제하는 것과 같은 이유다.

import type { CollectionConfig } from "payload";
import sharp from "sharp";

/**
 * 업로드 버퍼 → 16px 폭 base64 WebP (약 300~600B).
 *
 * next/image의 placeholder="blur"는 원격 이미지에 대해 blurDataURL을 자동
 * 생성하지 못한다(로컬 import한 정적 이미지에만 해준다). 그래서 업로드 시점에
 * 만들어 문서에 실어 둔다 — 읽기 경로에 추가 왕복이 생기지 않는다.
 */
async function makeBlurDataURL(buffer: Buffer): Promise<string | undefined> {
  try {
    const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();
    return `data:image/webp;base64,${blur.toString("base64")}`;
  } catch {
    // 플레이스홀더 하나 때문에 업로드를 통째로 실패시키지 않는다.
    // 값이 없으면 컴포넌트가 placeholder="empty"로 안전하게 떨어진다.
    return undefined;
  }
}

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
      // thumbnail(400×300)은 mapMediaDoc이 매핑하지 않는 죽은 파생본이다. 다만
      // 여기서 빼면 sizes_thumbnail_* 6개 컬럼을 DROP하는 파괴적 마이그레이션이
      // 운영 DB에 걸린다 — 신규 업로드의 처리 비용을 조금 아끼자고 치를 값이
      // 아니라 남겨 둔다. 정리한다면 미디어 재처리와 함께 별건으로 한다.
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 432, position: "centre" },
      { name: "feature", width: 1280, height: 720, position: "centre" },
    ],
    mimeTypes: ["image/*"],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // 새 파일이 올라온 요청에서만 다시 만든다. alt 수정 같은 일반 업데이트에
        // sharp를 돌릴 이유가 없다.
        const file = req.file;
        if (!file?.data) return data;
        return { ...data, blurDataURL: await makeBlurDataURL(file.data) };
      },
    ],
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
    {
      name: "blurDataURL",
      type: "text",
      // DB 컬럼명은 blur_data_u_r_l이다 — Payload가 연속 대문자를 낱개로 쪼갠다.
      // dbName으로 고쳐 보려 했지만 이 버전에서는 반영되지 않아 그대로 둔다.
      admin: {
        readOnly: true,
        description: "업로드 시 자동 생성되는 저해상도 미리보기. 직접 수정하지 마세요.",
      },
    },
  ],
};
