ALTER TABLE `routine_items` ADD `weight_unit` text;--> statement-breakpoint
-- Freeze existing items at whatever unit they are currently displayed in, which
-- is the user's default. Without this the rows stay null and keep following the
-- default around, which is the bug this column exists to fix.
UPDATE `routine_items`
SET `weight_unit` = COALESCE((SELECT `value` FROM `app_settings` WHERE `key` = 'default_weight_unit'), 'KG')
WHERE `weight_unit` IS NULL;
