CREATE TYPE "public"."plugin_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TABLE "plugins" (
	"id" text PRIMARY KEY NOT NULL,
	"plugin_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"author" text,
	"status" "plugin_status" DEFAULT 'active' NOT NULL,
	"path" text NOT NULL,
	"menu_items" text,
	"settings" text,
	"installed_by" text,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugins_plugin_id_unique" UNIQUE("plugin_id")
);
--> statement-breakpoint
ALTER TABLE "plugins" ADD CONSTRAINT "plugins_installed_by_users_id_fk" FOREIGN KEY ("installed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;