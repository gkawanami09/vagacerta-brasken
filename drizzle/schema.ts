import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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

/**
 * Courses table
 */
export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  skills: text("skills"), // JSON array of skills
  duration_hours: integer("duration_hours"),
  price: integer("price"), // 0 for free
  is_free: integer("is_free", { mode: "boolean" }).default(true),
  certification: integer("certification", { mode: "boolean" }).default(false),
  provider: text("provider"),
  thumbnail: text("thumbnail"),
  external_url: text("external_url"),
  recommended_for_user: integer("recommended_for_user", { mode: "boolean" }).default(false),
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

