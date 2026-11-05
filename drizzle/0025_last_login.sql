ALTER TABLE "persons" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
-- best guess for the past: a login credential or a session means the person has logged in before
UPDATE "persons" SET "last_login_at" = coalesce(
	(SELECT max(created_at) FROM sessions s WHERE s.person_id = persons.id),
	(SELECT max(coalesce(last_used_at, created_at)) FROM credentials c WHERE c.person_id = persons.id)
) WHERE "last_login_at" IS NULL;
