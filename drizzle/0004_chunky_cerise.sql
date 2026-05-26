CREATE TABLE `matchups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`courtId` integer,
	`status` text DEFAULT 'waiting' NOT NULL,
	`team_a` text NOT NULL,
	`team_b` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL
);
