CREATE TABLE IF NOT EXISTS `courts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sport` text NOT NULL,
	`matchType` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`createdAt` text NOT NULL
);
