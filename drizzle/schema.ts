import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  /**
   * Hash de senha para autenticação local (bcrypt).
   * Nulo para contas vinculadas apenas a OAuth.
   */
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().default(new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Jobs/Vagas table
 */
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  benefits: text("benefits"),
  location: text("location"),
  salary_min: integer("salary_min"),
  salary_max: integer("salary_max"),
  contract_type: text("contract_type"), // CLT, PJ, Estágio, etc
  modality: text("modality"), // Remoto, Presencial, Híbrido
  compatibility: integer("compatibility").default(0), // 0-100 percentage
  company_logo: text("company_logo"),
  company_description: text("company_description"),
  selection_process: text("selection_process"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

export const job_companies = sqliteTable(
  "job_companies",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    website: text("website"),
    logoUrl: text("logo_url"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
  },
  (table) => ({
    nameUnique: uniqueIndex("idx_job_companies_name").on(table.name),
  })
);

export type JobCompany = typeof job_companies.$inferSelect;
export type InsertJobCompany = typeof job_companies.$inferInsert;

export const job_listings = sqliteTable(
  "job_listings",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    companyId: text("company_id"),
    location: text("location"),
    remote: integer("remote", { mode: "boolean" }).notNull().default(false),
    description: text("description"),
    requirements: text("requirements"),
    benefits: text("benefits"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryLabel: text("salary_label"),
    applyUrl: text("apply_url").notNull(),
    source: text("source").notNull(),
    externalId: text("external_id"),
    postedAt: integer("posted_at", { mode: "timestamp" }),
    raw: text("raw"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
  },
  (table) => ({
    sourceExternalUnique: uniqueIndex("idx_job_listings_source_external").on(
      table.source,
      table.externalId
    ),
    applyUrlUnique: uniqueIndex("idx_job_listings_apply_url").on(table.applyUrl),
  })
);

export type JobListing = typeof job_listings.$inferSelect;
export type InsertJobListing = typeof job_listings.$inferInsert;

export const job_matches = sqliteTable(
  "job_matches",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => job_listings.id),
    score: integer("score").notNull().default(0),
    factors: text("factors"),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
  },
  (table) => ({
    userJobUnique: uniqueIndex("idx_job_matches_user_job").on(table.userId, table.jobId),
  })
);

export type JobMatch = typeof job_matches.$inferSelect;
export type InsertJobMatch = typeof job_matches.$inferInsert;

export const job_saved_listings = sqliteTable(
  "job_saved_listings",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => job_listings.id),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
  },
  (table) => ({
    uniqueUserJob: uniqueIndex("idx_job_saved_user_job").on(table.userId, table.jobId),
  })
);

export type JobSavedListing = typeof job_saved_listings.$inferSelect;
export type InsertJobSavedListing = typeof job_saved_listings.$inferInsert;

export const job_applications = sqliteTable(
  "job_applications",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => job_listings.id),
    resumePath: text("resume_path").notNull(),
    status: text("status").notNull().default("sent"),
    sentAt: integer("sentAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s','now')*1000)`),
  },
  (table) => ({
    userJobUnique: uniqueIndex("idx_job_applications_user_job").on(table.userId, table.jobId),
  })
);

export type JobApplication = typeof job_applications.$inferSelect;
export type InsertJobApplication = typeof job_applications.$inferInsert;

/**
 * Courses table
 */
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  provider: text("provider").notNull(),
  category: text("category"),
  priceLabel: text("price_label").notNull(),
  rating: real("rating"),
  url: text("url").notNull().unique(),
  imageUrl: text("image_url"),
  skills: text("skills").notNull().default("[]"),
  workload: text("workload"),
  estimatedTime: text("estimated_time"),
  certification: integer("certification", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Saved jobs/Vagas salvas
 */
export const saved_jobs = sqliteTable("saved_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  job_id: integer("job_id").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type SavedJob = typeof saved_jobs.$inferSelect;
export type InsertSavedJob = typeof saved_jobs.$inferInsert;

export const saved_courses = sqliteTable(
  "saved_courses",
  {
    id: text("id").primaryKey(),
    user_id: integer("user_id").notNull(),
    course_id: text("course_id")
      .notNull()
      .references(() => courses.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  },
  (table) => ({
    userCourseUnique: uniqueIndex("idx_saved_course_user_course").on(table.user_id, table.course_id),
  })
);

export type SavedCourse = typeof saved_courses.$inferSelect;
export type InsertSavedCourse = typeof saved_courses.$inferInsert;

export const course_recommendations = sqliteTable(
  "course_recommendations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id").notNull(),
    course_id: text("course_id")
      .notNull()
      .references(() => courses.id),
    score: real("score"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  },
  (table) => ({
    userCourseUnique: uniqueIndex("idx_course_recommendations_user_course").on(
      table.user_id,
      table.course_id
    ),
  })
);

export type CourseRecommendation = typeof course_recommendations.$inferSelect;
export type InsertCourseRecommendation = typeof course_recommendations.$inferInsert;

/**
 * Submitted resumes/Currículos enviados
 */
export const submitted_resumes = sqliteTable("submitted_resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  job_id: integer("job_id").notNull(),
  resume_url: text("resume_url").notNull(),
  status: text("status").default("submitted"), // submitted, viewed, rejected, accepted
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type SubmittedResume = typeof submitted_resumes.$inferSelect;
export type InsertSubmittedResume = typeof submitted_resumes.$inferInsert;

/**
 * Chat messages with MAIA
 */
export const chat_messages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),
  sender: text("sender").notNull(), // 'user' or 'maia'
  content: text("content").notNull(),
  attachment_url: text("attachment_url"),
  attachment_type: text("attachment_type"), // 'pdf', 'image', etc
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type ChatMessage = typeof chat_messages.$inferSelect;
export type InsertChatMessage = typeof chat_messages.$inferInsert;

/**
 * User preferences and profile
 */
export const user_profiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().unique(),
  phone: text("phone"),
  cpf: text("cpf"),
  location: text("location"),
  work_modality: text("work_modality"), // Remoto, Presencial, Híbrido
  salary_expectation: integer("salary_expectation"),
  areas_of_interest: text("areas_of_interest"), // JSON array
  notification_whatsapp: integer("notification_whatsapp", { mode: "boolean" }).default(true),
  notification_push: integer("notification_push", { mode: "boolean" }).default(true),
  notification_email: integer("notification_email", { mode: "boolean" }).default(true),
  notification_frequency: text("notification_frequency").default("daily"), // daily, weekly
  resume_url: text("resume_url"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export type UserProfile = typeof user_profiles.$inferSelect;
export type InsertUserProfile = typeof user_profiles.$inferInsert;
