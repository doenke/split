-- "Sprit" belongs to "Transport"
UPDATE "expenses" SET "category_id" = 'transport' WHERE "category_id" = 'fuel';--> statement-breakpoint
UPDATE "profiles" SET "default_category_id" = 'transport' WHERE "default_category_id" = 'fuel';--> statement-breakpoint
DELETE FROM "categories" WHERE "id" = 'fuel' AND "group_id" IS NULL;
