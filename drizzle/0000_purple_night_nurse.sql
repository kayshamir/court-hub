CREATE TABLE `courts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sport` text NOT NULL,
	`matchType` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_a` text NOT NULL,
	`team_b` text NOT NULL,
	`score_a` integer NOT NULL,
	`score_b` integer NOT NULL,
	`winner` text NOT NULL,
	`played_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matchups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`courtId` integer,
	`status` text DEFAULT 'waiting' NOT NULL,
	`team_a` text NOT NULL,
	`team_b` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rank` text NOT NULL,
	`form` text DEFAULT '[]' NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`rate` text,
	`isTopPerformer` integer DEFAULT 0 NOT NULL,
	`level` text DEFAULT 'Beginner' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL
);
