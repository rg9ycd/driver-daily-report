CREATE TABLE `daily_reports` (
	`id` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`reportDate` varchar(32) NOT NULL,
	`vehicleNumber` varchar(64) NOT NULL,
	`siteName` text,
	`sq` varchar(64),
	`confirmer` varchar(160),
	`inspectionJson` text NOT NULL,
	`damagesJson` text NOT NULL,
	`recordsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`)
);
