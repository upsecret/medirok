/**
 * hospitals.logo (media 관계) 추가 + media.prefix 정리.
 *
 * media.prefix는 add_thumbnails가 만든 잔재 컬럼이다. Blob 플러그인의
 * `alwaysInsertFields`가 **비활성 분기에서만** 동작해, 토큰이 없는 환경에서
 * 스키마를 뜰 때만 이 필드가 생겼다. 운영은 토큰이 있어 이 컬럼을 읽지도 쓰지도
 * 않는다(18행 전부 빈 값 확인). 플래그를 제거해 양쪽 스키마를 일치시켰으므로
 * 여기서 컬럼도 함께 정리한다 — 남겨두면 이후 migrate:create가 매번 DROP을 다시 낸다.
 */

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hospitals" ADD COLUMN "logo_id" integer;
  ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hospitals_logo_idx" ON "hospitals" USING btree ("logo_id");
  ALTER TABLE "media" DROP COLUMN "prefix";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hospitals" DROP CONSTRAINT "hospitals_logo_id_media_id_fk";
  
  DROP INDEX "hospitals_logo_idx";
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "hospitals" DROP COLUMN "logo_id";`)
}
