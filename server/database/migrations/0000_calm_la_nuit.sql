CREATE TYPE "public"."charge_status" AS ENUM('unpaid', 'paid', 'late');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('water', 'gas', 'electricity', 'elevator', 'cleaning', 'repair', 'other');--> statement-breakpoint
CREATE TYPE "public"."announcement_importance" AS ENUM('normal', 'important');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('manager', 'resident');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('announcement', 'problem', 'charge', 'service');--> statement-breakpoint
CREATE TYPE "public"."problem_category" AS ENUM('water', 'electricity', 'elevator', 'gas', 'common', 'cleaning', 'other');--> statement-breakpoint
CREATE TYPE "public"."problem_status" AS ENUM('new', 'in-progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."provider_category" AS ENUM('plumbing', 'electricity', 'elevator', 'cleaning', 'painting', 'ac', 'boiler', 'installations', 'glass', 'lock', 'other');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('occupied', 'vacant', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('resident', 'manager', 'admin');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"importance" "announcement_importance" DEFAULT 'normal' NOT NULL,
	"image_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "building_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" uuid,
	"role" "member_role" DEFAULT 'resident' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invited_by" uuid
);
--> statement-breakpoint
CREATE TABLE "building_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"number" text NOT NULL,
	"floor" text NOT NULL,
	"status" "unit_status" DEFAULT 'vacant' NOT NULL,
	"resident_name" text,
	"resident_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"description" text,
	"manager_id" uuid NOT NULL,
	"invitation_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount" integer NOT NULL,
	"period" text DEFAULT '' NOT NULL,
	"due_date" text DEFAULT '' NOT NULL,
	"description" text,
	"status" charge_status DEFAULT 'unpaid' NOT NULL,
	"paid_at" text,
	"paid_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount" integer NOT NULL,
	"category" "expense_category" NOT NULL,
	"date" text DEFAULT '' NOT NULL,
	"description" text,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_by" uuid NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_by" uuid,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"link" text,
	"unread" boolean DEFAULT true NOT NULL,
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"category" "problem_category" NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text,
	"status" "problem_status" DEFAULT 'new' NOT NULL,
	"created_by" uuid NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "provider_category" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"rating" numeric(3, 1) DEFAULT '0' NOT NULL,
	"phone" text NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"working_hours" text DEFAULT '' NOT NULL,
	"image_url" text,
	"trusted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'resident' NOT NULL,
	"avatar_initials" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_members" ADD CONSTRAINT "building_members_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_members" ADD CONSTRAINT "building_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_members" ADD CONSTRAINT "building_members_unit_id_building_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."building_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_members" ADD CONSTRAINT "building_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_units" ADD CONSTRAINT "building_units_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "building_units" ADD CONSTRAINT "building_units_resident_user_id_users_id_fk" FOREIGN KEY ("resident_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_building_created_idx" ON "announcements" USING btree ("building_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "building_members_user_unique" ON "building_members" USING btree ("building_id","user_id");--> statement-breakpoint
CREATE INDEX "building_members_building_id_idx" ON "building_members" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "building_members_user_id_idx" ON "building_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "building_units_number_unique" ON "building_units" USING btree ("building_id","number");--> statement-breakpoint
CREATE INDEX "building_units_building_id_idx" ON "building_units" USING btree ("building_id");--> statement-breakpoint
CREATE UNIQUE INDEX "buildings_invitation_code_unique" ON "buildings" USING btree ("invitation_code");--> statement-breakpoint
CREATE INDEX "buildings_manager_id_idx" ON "buildings" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "charges_building_due_idx" ON "charges" USING btree ("building_id","due_date");--> statement-breakpoint
CREATE INDEX "expenses_building_date_idx" ON "expenses" USING btree ("building_id","date");--> statement-breakpoint
CREATE INDEX "invitations_building_id_idx" ON "invitations" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","unread");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_type_source_unique" ON "notifications" USING btree ("user_id","type","source_id");--> statement-breakpoint
CREATE INDEX "problem_reports_building_status_idx" ON "problem_reports" USING btree ("building_id","status");--> statement-breakpoint
CREATE INDEX "problem_reports_building_category_idx" ON "problem_reports" USING btree ("building_id","category");--> statement-breakpoint
CREATE INDEX "service_providers_category_idx" ON "service_providers" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");