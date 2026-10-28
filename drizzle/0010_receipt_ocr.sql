ALTER TABLE "attachments" ADD COLUMN "ocr_status" text;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "ocr_result" jsonb;