CREATE TABLE `field_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`species` text NOT NULL,
	`park` text NOT NULL,
	`date` text NOT NULL,
	`observation` text NOT NULL,
	`source_credit` text NOT NULL,
	`source_url` text NOT NULL,
	`origin` text DEFAULT 'student' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE INDEX `field_submissions_status_date` ON `field_submissions` (`status`,`date`);