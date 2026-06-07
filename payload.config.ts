// 메디록 Payload CMS 설정
// Postgres (DATABASE_URI). 로컬/프로덕션 모두 Postgres 사용 (Vercel 호환)
// Admin UI: /admin

import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { Articles } from "@/payload/collections/Articles";
import { QnAs } from "@/payload/collections/QnAs";
import { RegionalGuides } from "@/payload/collections/RegionalGuides";
import { HospitalInterviews } from "@/payload/collections/HospitalInterviews";
import { CaseStories } from "@/payload/collections/CaseStories";
import { Hospitals } from "@/payload/collections/Hospitals";
import { Doctors } from "@/payload/collections/Doctors";
import { Departments } from "@/payload/collections/Departments";
import { Regions } from "@/payload/collections/Regions";
import { Treatments } from "@/payload/collections/Treatments";
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
    // 매거진 5종 (CMS 영업 도구)
    Articles,
    QnAs,
    RegionalGuides,
    HospitalInterviews,
    CaseStories,
    // 의료 마스터 데이터
    Hospitals,
    Doctors,
    Departments,
    Regions,
    Treatments,
    // 미디어 + 사용자(관리자)
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "default-dev-secret-please-change",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  typescript: {
    outputFile: path.resolve(dirname, "src/payload-types.ts"),
  },
});
