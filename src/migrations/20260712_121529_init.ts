import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_magazines_type" AS ENUM('article', 'qna', 'regional', 'interview', 'case');
  CREATE TYPE "public"."enum_magazines_disclaimer_type" AS ENUM('general', 'case', 'price', 'qna');
  CREATE TYPE "public"."enum_hospitals_tier" AS ENUM('STANDARD', 'PREMIUM', 'HERITAGE');
  CREATE TYPE "public"."enum_regions_level" AS ENUM('sido', 'sigungu', 'dong');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'sales', 'curator');
  CREATE TABLE "magazines_faq_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "magazines_price_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"treatment" varchar NOT NULL,
  	"price_range" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "magazines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_magazines_type" DEFAULT 'article' NOT NULL,
  	"seo_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"short_answer" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"linked_department_id" integer,
  	"linked_region_id" integer,
  	"author_doctor_id" integer,
  	"linked_treatment_slug" varchar,
  	"author_name" varchar,
  	"author_title" varchar,
  	"disclaimer_type" "enum_magazines_disclaimer_type" DEFAULT 'general' NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"category" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "magazines_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "magazines_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"hospitals_id" integer
  );
  
  CREATE TABLE "hospitals_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"treatment_name" varchar NOT NULL,
  	"treatment_note" varchar,
  	"normal_low" numeric NOT NULL,
  	"normal_high" numeric NOT NULL,
  	"event_low" numeric,
  	"event_high" numeric,
  	"insurance_note" varchar
  );
  
  CREATE TABLE "hospitals_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rating" numeric,
  	"content" varchar,
  	"reviewer_name" varchar,
  	"visited_at" varchar,
  	"treatment_name" varchar,
  	"age_group" varchar,
  	"is_receipt_verified" boolean,
  	"is_phone_verified" boolean
  );
  
  CREATE TABLE "hospitals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_kr" varchar NOT NULL,
  	"short_description" varchar,
  	"department_id" integer NOT NULL,
  	"region_id" integer NOT NULL,
  	"address_line" varchar NOT NULL,
  	"nearest_station" varchar,
  	"nearest_station_name" varchar,
  	"walking_minutes" numeric,
  	"tier" "enum_hospitals_tier" DEFAULT 'STANDARD' NOT NULL,
  	"phone" varchar,
  	"year_established" numeric,
  	"rating" numeric DEFAULT 0 NOT NULL,
  	"review_count" numeric DEFAULT 0 NOT NULL,
  	"doctor_count" numeric DEFAULT 0 NOT NULL,
  	"monthly_visitors" numeric,
  	"certification_stage1_history" boolean,
  	"certification_stage1_detail" varchar,
  	"certification_stage2_reviews" boolean,
  	"certification_stage2_detail" varchar,
  	"certification_stage3_credentials" boolean,
  	"certification_stage3_detail" varchar,
  	"certification_stage4_facility" boolean,
  	"certification_stage4_detail" varchar,
  	"certification_certified_at" varchar,
  	"curation_note_text" varchar,
  	"curation_note_curator_name" varchar,
  	"curation_note_curator_title" varchar,
  	"hours_weekday" varchar,
  	"hours_saturday" varchar,
  	"hours_sunday" varchar,
  	"hours_lunch" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hospitals_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "doctors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_kr" varchar NOT NULL,
  	"name_hanja" varchar,
  	"title" varchar,
  	"years_experience" numeric,
  	"specialty" varchar,
  	"hospital_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "doctors_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "departments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_kr" varchar NOT NULL,
  	"name_en" varchar NOT NULL,
  	"name_jp" varchar,
  	"hanja" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"priority" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "regions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_kr" varchar NOT NULL,
  	"name_en" varchar,
  	"level" "enum_regions_level",
  	"parent_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_feature_url" varchar,
  	"sizes_feature_width" numeric,
  	"sizes_feature_height" numeric,
  	"sizes_feature_mime_type" varchar,
  	"sizes_feature_filesize" numeric,
  	"sizes_feature_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"magazines_id" integer,
  	"hospitals_id" integer,
  	"doctors_id" integer,
  	"departments_id" integer,
  	"regions_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "magazines_faq_blocks" ADD CONSTRAINT "magazines_faq_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines_price_table" ADD CONSTRAINT "magazines_price_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_linked_department_id_departments_id_fk" FOREIGN KEY ("linked_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_linked_region_id_regions_id_fk" FOREIGN KEY ("linked_region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_author_doctor_id_doctors_id_fk" FOREIGN KEY ("author_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "magazines_texts" ADD CONSTRAINT "magazines_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines_rels" ADD CONSTRAINT "magazines_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines_rels" ADD CONSTRAINT "magazines_rels_hospitals_fk" FOREIGN KEY ("hospitals_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hospitals_prices" ADD CONSTRAINT "hospitals_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hospitals_reviews" ADD CONSTRAINT "hospitals_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hospitals_texts" ADD CONSTRAINT "hospitals_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "doctors" ADD CONSTRAINT "doctors_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "doctors_texts" ADD CONSTRAINT "doctors_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_regions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_magazines_fk" FOREIGN KEY ("magazines_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hospitals_fk" FOREIGN KEY ("hospitals_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_doctors_fk" FOREIGN KEY ("doctors_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regions_fk" FOREIGN KEY ("regions_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "magazines_faq_blocks_order_idx" ON "magazines_faq_blocks" USING btree ("_order");
  CREATE INDEX "magazines_faq_blocks_parent_id_idx" ON "magazines_faq_blocks" USING btree ("_parent_id");
  CREATE INDEX "magazines_price_table_order_idx" ON "magazines_price_table" USING btree ("_order");
  CREATE INDEX "magazines_price_table_parent_id_idx" ON "magazines_price_table" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "magazines_slug_idx" ON "magazines" USING btree ("slug");
  CREATE INDEX "magazines_linked_department_idx" ON "magazines" USING btree ("linked_department_id");
  CREATE INDEX "magazines_linked_region_idx" ON "magazines" USING btree ("linked_region_id");
  CREATE INDEX "magazines_author_doctor_idx" ON "magazines" USING btree ("author_doctor_id");
  CREATE INDEX "magazines_updated_at_idx" ON "magazines" USING btree ("updated_at");
  CREATE INDEX "magazines_created_at_idx" ON "magazines" USING btree ("created_at");
  CREATE INDEX "magazines_texts_order_parent" ON "magazines_texts" USING btree ("order","parent_id");
  CREATE INDEX "magazines_rels_order_idx" ON "magazines_rels" USING btree ("order");
  CREATE INDEX "magazines_rels_parent_idx" ON "magazines_rels" USING btree ("parent_id");
  CREATE INDEX "magazines_rels_path_idx" ON "magazines_rels" USING btree ("path");
  CREATE INDEX "magazines_rels_hospitals_id_idx" ON "magazines_rels" USING btree ("hospitals_id");
  CREATE INDEX "hospitals_prices_order_idx" ON "hospitals_prices" USING btree ("_order");
  CREATE INDEX "hospitals_prices_parent_id_idx" ON "hospitals_prices" USING btree ("_parent_id");
  CREATE INDEX "hospitals_reviews_order_idx" ON "hospitals_reviews" USING btree ("_order");
  CREATE INDEX "hospitals_reviews_parent_id_idx" ON "hospitals_reviews" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hospitals_slug_idx" ON "hospitals" USING btree ("slug");
  CREATE INDEX "hospitals_department_idx" ON "hospitals" USING btree ("department_id");
  CREATE INDEX "hospitals_region_idx" ON "hospitals" USING btree ("region_id");
  CREATE INDEX "hospitals_nearest_station_name_idx" ON "hospitals" USING btree ("nearest_station_name");
  CREATE INDEX "hospitals_updated_at_idx" ON "hospitals" USING btree ("updated_at");
  CREATE INDEX "hospitals_created_at_idx" ON "hospitals" USING btree ("created_at");
  CREATE INDEX "hospitals_texts_order_parent" ON "hospitals_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "doctors_slug_idx" ON "doctors" USING btree ("slug");
  CREATE INDEX "doctors_hospital_idx" ON "doctors" USING btree ("hospital_id");
  CREATE INDEX "doctors_updated_at_idx" ON "doctors" USING btree ("updated_at");
  CREATE INDEX "doctors_created_at_idx" ON "doctors" USING btree ("created_at");
  CREATE INDEX "doctors_texts_order_parent" ON "doctors_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "departments_slug_idx" ON "departments" USING btree ("slug");
  CREATE INDEX "departments_updated_at_idx" ON "departments" USING btree ("updated_at");
  CREATE INDEX "departments_created_at_idx" ON "departments" USING btree ("created_at");
  CREATE UNIQUE INDEX "regions_slug_idx" ON "regions" USING btree ("slug");
  CREATE INDEX "regions_level_idx" ON "regions" USING btree ("level");
  CREATE INDEX "regions_parent_idx" ON "regions" USING btree ("parent_id");
  CREATE INDEX "regions_updated_at_idx" ON "regions" USING btree ("updated_at");
  CREATE INDEX "regions_created_at_idx" ON "regions" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_feature_sizes_feature_filename_idx" ON "media" USING btree ("sizes_feature_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_magazines_id_idx" ON "payload_locked_documents_rels" USING btree ("magazines_id");
  CREATE INDEX "payload_locked_documents_rels_hospitals_id_idx" ON "payload_locked_documents_rels" USING btree ("hospitals_id");
  CREATE INDEX "payload_locked_documents_rels_doctors_id_idx" ON "payload_locked_documents_rels" USING btree ("doctors_id");
  CREATE INDEX "payload_locked_documents_rels_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("departments_id");
  CREATE INDEX "payload_locked_documents_rels_regions_id_idx" ON "payload_locked_documents_rels" USING btree ("regions_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "magazines_faq_blocks" CASCADE;
  DROP TABLE "magazines_price_table" CASCADE;
  DROP TABLE "magazines" CASCADE;
  DROP TABLE "magazines_texts" CASCADE;
  DROP TABLE "magazines_rels" CASCADE;
  DROP TABLE "hospitals_prices" CASCADE;
  DROP TABLE "hospitals_reviews" CASCADE;
  DROP TABLE "hospitals" CASCADE;
  DROP TABLE "hospitals_texts" CASCADE;
  DROP TABLE "doctors" CASCADE;
  DROP TABLE "doctors_texts" CASCADE;
  DROP TABLE "departments" CASCADE;
  DROP TABLE "regions" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_magazines_type";
  DROP TYPE "public"."enum_magazines_disclaimer_type";
  DROP TYPE "public"."enum_hospitals_tier";
  DROP TYPE "public"."enum_regions_level";
  DROP TYPE "public"."enum_users_role";`)
}
