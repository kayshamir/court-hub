CREATE TABLE IF NOT EXISTS `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_a` text NOT NULL,
	`team_b` text NOT NULL,
	`score_a` integer NOT NULL,
	`score_b` integer NOT NULL,
	`winner` text NOT NULL,
	`played_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rank` text NOT NULL,
	`form` text DEFAULT '[]' NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`rate` text,
	`isTopPerformer` integer DEFAULT 0 NOT NULL
);
