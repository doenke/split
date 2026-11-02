-- built-in category "Essen & Trinken" is now "Restaurant & Kneipe" (unless someone renamed it already)
UPDATE "categories" SET "name" = 'Restaurant & Kneipe' WHERE "id" = 'food' AND "group_id" IS NULL AND "name" = 'Essen & Trinken';
