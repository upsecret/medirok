import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "magazines" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "blog_posts" ADD COLUMN "thumbnail_id" integer;
  ALTER TABLE "media" ADD COLUMN "credit" varchar;
  ALTER TABLE "media" ADD COLUMN "source_url" varchar;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "magazines_thumbnail_idx" ON "magazines" USING btree ("thumbnail_id");
  CREATE INDEX "blog_posts_thumbnail_idx" ON "blog_posts" USING btree ("thumbnail_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "magazines" DROP CONSTRAINT "magazines_thumbnail_id_media_id_fk";
  
  ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_thumbnail_id_media_id_fk";
  
  DROP INDEX "magazines_thumbnail_idx";
  DROP INDEX "blog_posts_thumbnail_idx";
  ALTER TABLE "magazines" DROP COLUMN "thumbnail_id";
  ALTER TABLE "blog_posts" DROP COLUMN "thumbnail_id";
  ALTER TABLE "media" DROP COLUMN "credit";
  ALTER TABLE "media" DROP COLUMN "source_url";
  ALTER TABLE "media" DROP COLUMN "prefix";`)
}
