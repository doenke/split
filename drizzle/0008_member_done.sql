ALTER TABLE "memberships" ADD COLUMN "done_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "done_by" text;