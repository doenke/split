CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"expense_id" text,
	"file_name" text NOT NULL,
	"original_name" text,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_expense" ON "attachments" USING btree ("expense_id");