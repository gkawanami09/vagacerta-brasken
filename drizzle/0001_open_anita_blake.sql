CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`sender` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`attachment_url` varchar(512),
	`attachment_type` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`skills` text,
	`duration_hours` int,
	`price` int,
	`is_free` boolean DEFAULT true,
	`certification` boolean DEFAULT false,
	`provider` varchar(255),
	`thumbnail` varchar(512),
	`external_url` varchar(512),
	`recommended_for_user` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`description` text,
	`requirements` text,
	`responsibilities` text,
	`benefits` text,
	`location` varchar(255),
	`salary_min` int,
	`salary_max` int,
	`contract_type` varchar(64),
	`modality` varchar(64),
	`compatibility` int DEFAULT 0,
	`company_logo` varchar(512),
	`company_description` text,
	`selection_process` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submitted_resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`resume_url` varchar(512) NOT NULL,
	`status` varchar(64) DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submitted_resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`phone` varchar(20),
	`cpf` varchar(14),
	`location` varchar(255),
	`work_modality` varchar(64),
	`salary_expectation` int,
	`areas_of_interest` text,
	`notification_whatsapp` boolean DEFAULT true,
	`notification_push` boolean DEFAULT true,
	`notification_email` boolean DEFAULT true,
	`notification_frequency` varchar(64) DEFAULT 'daily',
	`resume_url` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_user_id_unique` UNIQUE(`user_id`)
);
