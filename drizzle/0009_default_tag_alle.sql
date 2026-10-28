ALTER TABLE "memberships" ALTER COLUMN "tags" SET DEFAULT '{"alle"}';--> statement-breakpoint
UPDATE "memberships" SET "tags" = array_prepend('alle', "tags") WHERE NOT ('alle' = ANY("tags"));
