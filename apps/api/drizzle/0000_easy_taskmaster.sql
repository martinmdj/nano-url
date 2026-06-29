CREATE TABLE IF NOT EXISTS "clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"url_id" integer NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"referer" text,
	"country" varchar(100),
	"clicked_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" varchar(10) NOT NULL,
	"long_url" text NOT NULL,
	"user_id" integer,
	"clicks" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "urls_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clicks" ADD CONSTRAINT "clicks_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "urls" ADD CONSTRAINT "urls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
