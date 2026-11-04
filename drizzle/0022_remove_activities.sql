-- "Aktivitäten" is the same as "Eintritt"
UPDATE "expenses" SET "category_id" = 'tickets' WHERE "category_id" = 'activities';--> statement-breakpoint
UPDATE "profiles" SET "default_category_id" = 'tickets' WHERE "default_category_id" = 'activities';--> statement-breakpoint
DELETE FROM "categories" WHERE "id" = 'activities' AND "group_id" IS NULL;
