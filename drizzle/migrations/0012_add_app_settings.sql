CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`app_name` text DEFAULT 'postbox' NOT NULL,
	`icon_key` text,
	`updated_at` integer NOT NULL
);

INSERT INTO `app_settings` (`id`, `app_name`, `updated_at`)
VALUES ('default', 'postbox', unixepoch());
