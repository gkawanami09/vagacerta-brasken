CREATE TABLE `chat_messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`sender` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`attachment_url` varchar(1024),
	`attachment_type` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`skills` text,
	`duration_hours` int,
	`price` int,
	`is_free` boolean DEFAULT true,
	`certification` boolean DEFAULT false,
	`provider` varchar(255),
	`thumbnail` varchar(255),
	`external_url` varchar(1024),
	`recommended_for_user` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`description` text,
	`requirements` text,
	`responsibilities` text,
	`benefits` text,
	`location` varchar(255),
	`salary_min` int,
	`salary_max` int,
	`contract_type` varchar(50),
	`modality` varchar(50),
	`compatibility` int DEFAULT 0,
	`company_logo` varchar(255),
	`company_description` text,
	`selection_process` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submitted_resumes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`resume_url` varchar(2048) NOT NULL,
	`status` varchar(50) DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submitted_resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`phone` varchar(50),
	`cpf` varchar(20),
	`location` varchar(255),
	`work_modality` varchar(50),
	`salary_expectation` int,
	`areas_of_interest` text,
	`notification_whatsapp` boolean DEFAULT true,
	`notification_push` boolean DEFAULT true,
	`notification_email` boolean DEFAULT true,
	`notification_frequency` varchar(50) DEFAULT 'daily',
	`resume_url` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`openId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`passwordHash` text,
	`loginMethod` varchar(50),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
