-- "Einkauf" duplicated "Lebensmittel"; "Sonstiges" is the same as no category
UPDATE "expenses" SET "category_id" = 'groceries' WHERE "category_id" = 'shopping';--> statement-breakpoint
UPDATE "expenses" SET "category_id" = NULL WHERE "category_id" = 'other';--> statement-breakpoint
UPDATE "profiles" SET "default_category_id" = 'groceries' WHERE "default_category_id" = 'shopping';--> statement-breakpoint
UPDATE "profiles" SET "default_category_id" = NULL WHERE "default_category_id" = 'other';--> statement-breakpoint
DELETE FROM "categories" WHERE "id" IN ('shopping', 'other') AND "group_id" IS NULL;
