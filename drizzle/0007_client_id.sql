ALTER TABLE "expenses" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_client_id_unique" UNIQUE("client_id");