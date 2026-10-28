ALTER TABLE "memberships" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
UPDATE "memberships" SET "tags" = array_remove("tags", 'alle') WHERE 'alle' = ANY("tags");
--> statement-breakpoint
UPDATE "profiles" SET "rule" = jsonb_set("rule", '{tagFilter,require}', ("rule"->'tagFilter'->'require') - 'alle') WHERE "rule"->'tagFilter'->'require' ? 'alle';
--> statement-breakpoint
UPDATE "profiles" SET "rule" = jsonb_set("rule", '{tagFilter,exclude}', ("rule"->'tagFilter'->'exclude') - 'alle') WHERE "rule"->'tagFilter'->'exclude' ? 'alle';
--> statement-breakpoint
UPDATE "expenses" SET "rule" = jsonb_set("rule", '{tagFilter,require}', ("rule"->'tagFilter'->'require') - 'alle') WHERE "rule"->'tagFilter'->'require' ? 'alle';
--> statement-breakpoint
UPDATE "expenses" SET "rule" = jsonb_set("rule", '{tagFilter,exclude}', ("rule"->'tagFilter'->'exclude') - 'alle') WHERE "rule"->'tagFilter'->'exclude' ? 'alle';
