// 메디록 Payload CMS 설정
// Postgres (DATABASE_URI). 로컬/프로덕션 모두 Postgres 사용 (Vercel 호환)
// Admin UI: /admin

import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Magazines } from "@/payload/collections/Magazines";
import { BlogPosts } from "@/payload/collections/BlogPosts";
import { Hospitals } from "@/payload/collections/Hospitals";
import { Doctors } from "@/payload/collections/Doctors";
import { Departments } from "@/payload/collections/Departments";
import { Regions } from "@/payload/collections/Regions";
import { Media } from "@/payload/collections/Media";
import { Users } from "@/payload/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: "users",
    meta: {
      titleSuffix: " · 메디록 어드민",
    },
  },
  collections: [
    // 매거진 (단일 통합 컬렉션)
    Magazines,
    // 병원 블로그 (네이버 블로그 이식 — enterprise)
    BlogPosts,
    // 의원 + 마스터 데이터
    Hospitals,
    Doctors,
    Departments,
    Regions,
    // 미디어 + 사용자(관리자)
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  // Media.imageSizes(thumbnail/card/feature) 생성에 필요. Payload 3.x는 sharp를
  // 자동으로 집어오지 않고 config로 넘겨받는다 — 빠지면 리사이즈가 조용히 생략된다.
  sharp,
  plugins: [
    // 이미지 저장소. Vercel 런타임은 파일시스템이 읽기 전용이라 Media의 로컬 디스크
    // (staticDir)로는 운영 업로드가 저장되지 않는다 — Blob으로 내보낸다.
    vercelBlobStorage({
      // 토큰이 없는 환경(e2e docker, 토큰 미설정 로컬)은 자동으로 로컬 디스크로 폴백한다.
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // 폴백 여부와 무관하게 스키마를 동일하게 유지한다.
      // 끄면 플러그인이 붙이는 필드가 환경마다 달라져, 로컬에서 만든 마이그레이션이
      // 운영 스키마와 어긋난다.
      alwaysInsertFields: true,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "default-dev-secret-please-change",
  db: postgresAdapter({
    // 런타임은 pooled 연결(DATABASE_URL), 마이그레이션/스키마 push는 직결(UNPOOLED) 권장
    pool: {
      connectionString:
        process.env.DATABASE_URL || process.env.DATABASE_URI || "",
    },
    // Payload 기본값(dev=on, production=off)을 유지하되, 명시적으로 끌 수 있게 한다.
    // PAYLOAD_DB_PUSH=false → 스키마를 건드리지 않고 데이터만 쓴다.
    // 운영 DB 대상 시드는 이 플래그로 실행할 것: 코드에서 이미 제거된 레거시 slug 필드 때문에
    // push가 미실행 마이그레이션(P3 컬럼 삭제)을 부수효과로 적용하려 든다.
    push:
      process.env.PAYLOAD_DB_PUSH !== "false" &&
      process.env.NODE_ENV !== "production",
  }),
  typescript: {
    outputFile: path.resolve(dirname, "src/payload-types.ts"),
  },
});
