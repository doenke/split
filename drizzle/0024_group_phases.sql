ALTER TABLE "groups" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
-- archived groups keep whether their final statement stood (last "group.final" after the last "group.reopen")
UPDATE "groups" SET "archived_at" = now(), "status" = CASE WHEN
	(SELECT max(created_at) FROM audit_log a WHERE a.group_id = groups.id AND a.action = 'group.final')
	> coalesce((SELECT max(created_at) FROM audit_log a WHERE a.group_id = groups.id AND a.action = 'group.reopen'), 'epoch'::timestamptz)
	THEN 'settled' ELSE 'active' END
WHERE "status" = 'archived';
