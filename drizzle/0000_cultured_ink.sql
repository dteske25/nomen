CREATE TABLE `names` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`origin` text,
	`phonetic_hash` text,
	`created_at` integer NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_name` text NOT NULL,
	`name_id` text NOT NULL,
	`vote` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON UPDATE no action ON DELETE no action
);
