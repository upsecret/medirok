import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hospitals" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hospitals_cover_image_idx" ON "hospitals" USING btree ("cover_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hospitals" DROP CONSTRAINT "hospitals_cover_image_id_media_id_fk";
  
  DROP INDEX "hospitals_cover_image_idx";
  ALTER TABLE "hospitals" DROP COLUMN "cover_image_id";`)
}
