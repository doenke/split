CREATE TABLE "mail_log" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"kind" text NOT NULL,
	"ref" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "email_from_oidc" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "mail_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_log" ADD CONSTRAINT "mail_log_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_log_person_kind" ON "mail_log" USING btree ("person_id","kind","ref");--> statement-breakpoint
-- addresses from the login provider count as confirmed
UPDATE "persons" SET "email_verified" = true, "email_from_oidc" = true WHERE "email" IS NOT NULL AND EXISTS (SELECT 1 FROM "credentials" c WHERE c."person_id" = "persons"."id" AND c."type" = 'oidc');
