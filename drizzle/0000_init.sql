CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text,
	"person_id" text,
	"action" text NOT NULL,
	"entity_id" text,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"public_key" text,
	"counter" integer,
	"transports" text,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"date" date NOT NULL,
	"currency" text NOT NULL,
	"per_eur" double precision NOT NULL,
	CONSTRAINT "exchange_rates_date_currency_pk" PRIMARY KEY("date","currency")
);
--> statement-breakpoint
CREATE TABLE "expense_payers" (
	"expense_id" text NOT NULL,
	"person_id" text NOT NULL,
	"amount" integer NOT NULL,
	CONSTRAINT "expense_payers_expense_id_person_id_pk" PRIMARY KEY("expense_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"title" text NOT NULL,
	"date" date NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"rate" double precision DEFAULT 1 NOT NULL,
	"rate_source" text DEFAULT 'none' NOT NULL,
	"rate_provisional" boolean DEFAULT false NOT NULL,
	"base_amount" integer NOT NULL,
	"private_amount" integer DEFAULT 0 NOT NULL,
	"category_id" text,
	"profile_id" text,
	"rule" jsonb,
	"period_from" date,
	"period_to" date,
	"period_unit" text,
	"notes" text,
	"frozen_shares" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🧳' NOT NULL,
	"description" text,
	"base_currency" text DEFAULT 'EUR' NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"settings" jsonb NOT NULL,
	"template_of" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invite_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"person_id" text,
	"group_id" text,
	"created_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kasse_members" (
	"kasse_id" text NOT NULL,
	"person_id" text NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	CONSTRAINT "kasse_members_kasse_id_person_id_pk" PRIMARY KEY("kasse_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "kassen" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"personal_of" text,
	"receiver_person_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"group_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"factor" double precision DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"participation_from" date,
	"participation_to" date,
	"kasse_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_group_id_person_id_pk" PRIMARY KEY("group_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"color" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"merged_into" text
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '🏷️' NOT NULL,
	"rule" jsonb NOT NULL,
	"default_category_id" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"is_oidc" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"from_kasse_id" text NOT NULL,
	"to_kasse_id" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'other' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"date" date NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasse_members" ADD CONSTRAINT "kasse_members_kasse_id_kassen_id_fk" FOREIGN KEY ("kasse_id") REFERENCES "public"."kassen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasse_members" ADD CONSTRAINT "kasse_members_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassen" ADD CONSTRAINT "kassen_personal_of_persons_id_fk" FOREIGN KEY ("personal_of") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kassen" ADD CONSTRAINT "kassen_receiver_person_id_persons_id_fk" FOREIGN KEY ("receiver_person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_kasse_id_kassen_id_fk" FOREIGN KEY ("kasse_id") REFERENCES "public"."kassen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_kasse_id_kassen_id_fk" FOREIGN KEY ("from_kasse_id") REFERENCES "public"."kassen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_kasse_id_kassen_id_fk" FOREIGN KEY ("to_kasse_id") REFERENCES "public"."kassen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_group" ON "audit_log" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_type_subject" ON "credentials" USING btree ("type","subject");--> statement-breakpoint
CREATE INDEX "expenses_group" ON "expenses" USING btree ("group_id","date");--> statement-breakpoint
CREATE INDEX "memberships_person" ON "memberships" USING btree ("person_id");