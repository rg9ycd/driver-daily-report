ALTER TABLE `daily_reports` ADD `driversText` text NOT NULL;--> statement-breakpoint
CREATE INDEX `daily_reports_date_idx` ON `daily_reports` (`reportDate`);--> statement-breakpoint
CREATE INDEX `daily_reports_vehicle_idx` ON `daily_reports` (`vehicleNumber`);--> statement-breakpoint
CREATE INDEX `daily_reports_sq_idx` ON `daily_reports` (`sq`);