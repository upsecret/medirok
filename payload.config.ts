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
import { CertificationApplications } from "@/payload/collections/CertificationApplications";
import { Users } from "@/payload/collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Blob 토큰 유무가 미디어 URL의 형태를 가른다. 아래 serverURL·
// disablePayloadAccessControl과 반드시 같은 조건으로 묶어야 한다.
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

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
    // 인증제 신청 접수 (B2B 리드)
    CertificationApplications,
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
      enabled: blobEnabled,
      // 주의: 여기에 disablePayloadAccessControl을 넘겨도 소용없다. 래퍼가
      // cloudStoragePlugin에 alwaysInsertFields·collections·useCompositePrefixes
      // 세 개만 전달한다(storage-vercel-blob/dist/index.js:94). 그래서 url 필드는
      // 항상 /api/media/file/* 프록시 경로로 나온다. CDN 직결 전환은 앱 레이어에서
      // 한다 — src/lib/payload-mappers.ts의 publicMediaUrl 참고.
      // alwaysInsertFields는 쓰지 않는다. 이 플러그인에서 그 옵션은 **비활성 분기에서만**
      // 동작해, 토큰이 없을 때만 media에 prefix 필드를 붙인다 — 즉 환경마다 스키마가
      // 갈리는 원인이 된다(토큰 有=prefix 없음 / 無=prefix 있음).
      // 빼두면 양쪽 모두 prefix가 없어 마이그레이션 생성이 결정적이 된다.
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
      // 서버리스는 인스턴스가 옆으로 늘어난다. 인스턴스마다 node-postgres 기본값
      // max:10을 잡으면 Neon pooler 한도에 먼저 부딪힌다. 인스턴스당 소수로 제한하고
      // 유휴 연결은 빨리 반납한다.
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
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
