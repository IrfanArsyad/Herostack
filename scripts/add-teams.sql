-- Add team_role enum
DO $$ BEGIN
    CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "description" text,
    "created_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
    "team_id" text NOT NULL,
    "user_id" text NOT NULL,
    "role" "team_role" DEFAULT 'member' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);

-- Add team_id to shelves if not exists
DO $$ BEGIN
    ALTER TABLE "shelves" ADD COLUMN "team_id" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add team_id to books if not exists
DO $$ BEGIN
    ALTER TABLE "books" ADD COLUMN "team_id" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "shelves" ADD CONSTRAINT "shelves_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "books" ADD CONSTRAINT "books_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
