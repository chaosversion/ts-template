CREATE TABLE `transactions` (
	`id` text(36) PRIMARY KEY DEFAULT '929efd57-31a8-4a17-8dae-b85b96c39c81' NOT NULL,
	`title` text(255) NOT NULL,
	`amount` real NOT NULL,
	`session_id` text(36) NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_session_id` ON `transactions` (`session_id`);