CREATE TABLE "payment_details" (
	"person_id" text PRIMARY KEY NOT NULL,
	"wero_contact" text,
	"wero_link" text,
	"iban" text,
	"account_holder" text,
	"paypal_me" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;