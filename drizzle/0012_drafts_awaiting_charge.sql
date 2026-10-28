ALTER TABLE "expenses" ADD COLUMN "status" text DEFAULT 'final' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "awaiting_charge" boolean DEFAULT false NOT NULL;