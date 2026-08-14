import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_certification_applications_interests" AS ENUM('certification', 'curation', 'content');
  CREATE TYPE "public"."enum_certification_applications_status" AS ENUM('pending', 'contacted', 'reviewing', 'listed', 'closed');
  CREATE TABLE "certification_applications_interests" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_certification_applications_interests",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "certification_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hospital_name" varchar NOT NULL,
  	"representative_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"region" varchar,
  	"department" varchar,
  	"homepage_url" varchar,
  	"message" varchar,
  	"status" "enum_certification_applications_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "certification_applications_id" integer;
  ALTER TABLE "certification_applications_interests" ADD CONSTRAINT "certification_applications_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."certification_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "certification_applications_interests_order_idx" ON "certification_applications_interests" USING btree ("order");
  CREATE INDEX "certification_applications_interests_parent_idx" ON "certification_applications_interests" USING btree ("parent_id");
  CREATE INDEX "certification_applications_updated_at_idx" ON "certification_applications" USING btree ("updated_at");
  CREATE INDEX "certification_applications_created_at_idx" ON "certification_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certification_applications_fk" FOREIGN KEY ("certification_applications_id") REFERENCES "public"."certification_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_certification_applications_idx" ON "payload_locked_documents_rels" USING btree ("certification_applications_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "certification_applications_interests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "certification_applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "certification_applications_interests" CASCADE;
  DROP TABLE "certification_applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_certification_applications_fk";
  
  DROP INDEX "payload_locked_documents_rels_certification_applications_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "certification_applications_id";
  DROP TYPE "public"."enum_certification_applications_interests";
  DROP TYPE "public"."enum_certification_applications_status";`)
}
