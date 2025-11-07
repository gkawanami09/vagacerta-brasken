import { eq, and, gte, lte, like, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import {
  InsertUser,
  users,
  jobs,
  courses,
  saved_jobs,
  submitted_resumes,
  chat_messages,
  user_profiles,
  saved_courses,
  course_recommendations,
} from "../drizzle/schema";
import type { Course, SavedCourse, CourseRecommendation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlJs: any | null = null;
let _sqlJsDb: any | null = null;
let _dbFilePath: string | null = null;
let _initPromise: Promise<void> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
async function ensureInitialized() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL || 'file:./app.sqlite';
    const dbPath = dbUrl.replace('file://', '').replace('file:', '');
    _dbFilePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

    _sqlJs = await initSqlJs({ locateFile: (file: string) => path.resolve(process.cwd(), 'node_modules/sql.js/dist', file) });

    let fileBuffer: Uint8Array | undefined = undefined;
    try {
      if (_dbFilePath && fs.existsSync(_dbFilePath)) {
        const buf = fs.readFileSync(_dbFilePath);
        fileBuffer = new Uint8Array(buf);
      }
    } catch {}

    _sqlJsDb = new _sqlJs.Database(fileBuffer);
    // Ensure schema for SQLite (sql.js)
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        openId TEXT NOT NULL UNIQUE,
        name TEXT,
        email TEXT,
        passwordHash TEXT,
        loginMethod TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        lastSignedIn INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        description TEXT,
        requirements TEXT,
        responsibilities TEXT,
        benefits TEXT,
        location TEXT,
        salary_min INTEGER,
        salary_max INTEGER,
        contract_type TEXT,
        modality TEXT,
        compatibility INTEGER DEFAULT 0,
        company_logo TEXT,
        company_description TEXT,
        selection_process TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS job_companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        logo_url TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_companies_name ON job_companies(name);
      CREATE TABLE IF NOT EXISTS job_listings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company_id TEXT,
        location TEXT,
        remote INTEGER DEFAULT 0,
        description TEXT,
        requirements TEXT,
        benefits TEXT,
        salary_min INTEGER,
        salary_max INTEGER,
        salary_label TEXT,
        apply_url TEXT NOT NULL,
        source TEXT NOT NULL,
        external_id TEXT,
        posted_at INTEGER,
        raw TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        FOREIGN KEY(company_id) REFERENCES job_companies(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_listings_source_external ON job_listings(source, external_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_listings_apply_url ON job_listings(apply_url);
      CREATE TABLE IF NOT EXISTS job_matches (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        job_id TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        factors TEXT,
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        FOREIGN KEY(job_id) REFERENCES job_listings(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_matches_user_job ON job_matches(user_id, job_id);
      CREATE TABLE IF NOT EXISTS job_saved_listings (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        job_id TEXT NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        FOREIGN KEY(job_id) REFERENCES job_listings(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_saved_user_job ON job_saved_listings(user_id, job_id);
      CREATE TABLE IF NOT EXISTS job_applications (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        job_id TEXT NOT NULL,
        resume_path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        sentAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        FOREIGN KEY(job_id) REFERENCES job_listings(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_user_job ON job_applications(user_id, job_id);
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        provider TEXT NOT NULL,
        category TEXT,
        price_label TEXT NOT NULL,
        rating REAL,
        url TEXT NOT NULL UNIQUE,
        image_url TEXT,
        skills TEXT NOT NULL DEFAULT '[]',
        workload TEXT,
        estimated_time TEXT,
        certification INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS saved_courses (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        course_id TEXT NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        UNIQUE(user_id, course_id)
      );
      CREATE TABLE IF NOT EXISTS course_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id TEXT NOT NULL,
        score REAL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        UNIQUE(user_id, course_id)
      );
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS submitted_resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        resume_url TEXT NOT NULL,
        status TEXT DEFAULT 'submitted',
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        phone TEXT,
        cpf TEXT,
        location TEXT,
        work_modality TEXT,
        salary_expectation INTEGER,
        areas_of_interest TEXT,
        notification_whatsapp INTEGER DEFAULT 1,
        notification_push INTEGER DEFAULT 1,
        notification_email INTEGER DEFAULT 1,
        notification_frequency TEXT DEFAULT 'daily',
        resume_url TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_cpf ON user_profiles(cpf);
    `;
    _sqlJsDb.exec(schemaSql);

    try {
      const info = _sqlJsDb.exec("PRAGMA table_info(courses)");
      if (info.length > 0) {
        const columns = info[0].values.map((row: any[]) => row[1]);
        if (!columns.includes("price_label")) {
          console.info("[DB] Migrating legacy courses table to new schema");
          _sqlJsDb.exec(`ALTER TABLE courses RENAME TO courses_legacy;`);
          _sqlJsDb.exec(`
            CREATE TABLE IF NOT EXISTS courses (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              provider TEXT NOT NULL,
              category TEXT,
              price_label TEXT NOT NULL,
              rating REAL,
              url TEXT NOT NULL UNIQUE,
              image_url TEXT,
              skills TEXT NOT NULL DEFAULT '[]',
              workload TEXT,
              estimated_time TEXT,
              certification INTEGER DEFAULT 0,
              createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
              updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
            );
          `);
          _sqlJsDb.exec(`
            INSERT OR IGNORE INTO courses (
              id,
              title,
              description,
              provider,
              category,
              price_label,
              rating,
              url,
              image_url,
              skills,
              workload,
              estimated_time,
              certification,
              createdAt,
              updatedAt
            )
            SELECT
              CAST(id AS TEXT) AS id,
              title,
              description,
              COALESCE(provider, 'Desconhecido'),
              NULL,
              CASE
                WHEN is_free = 1 THEN 'Gratuito'
                WHEN price IS NULL THEN 'Pago'
                ELSE printf('R$ %.2f', price / 100.0)
              END AS price_label,
              NULL,
              COALESCE(external_url, ''),
              thumbnail,
              COALESCE(skills, '[]'),
              CASE
                WHEN duration_hours IS NOT NULL THEN printf('%d horas', duration_hours)
                ELSE NULL
              END,
              NULL,
              certification,
              createdAt,
              updatedAt
            FROM courses_legacy;
          `);
          _sqlJsDb.exec(`DROP TABLE courses_legacy;`);
        }
      }
    } catch (error) {
      console.error("[DB] Failed to migrate courses schema:", error);
    }
    _db = drizzle(_sqlJsDb);
  })();
  return _initPromise;
}

async function persistDb() {
  if (!_sqlJsDb || !_dbFilePath) return;
  const data = _sqlJsDb.export();
  await fs.promises.writeFile(_dbFilePath, Buffer.from(data));
}

export const persistDatabase = persistDb;

export type DbCourseRecord = Omit<Course, "skills"> & { skills: string[] };

const parseSkills = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item)).filter((item) => item.trim().length > 0);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter((item) => item.trim().length > 0);
      }
    } catch {
      return raw
        .split(/[,;|]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
  return [];
};

const mapCourseRow = (row: Course): DbCourseRecord => ({
  ...row,
  skills: parseSkills((row as unknown as { skills: unknown }).skills),
});

export async function getDb() {
  if (!_db) {
    await ensureInitialized();
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const existing = await db.select().from(users).where(eq(users.openId, user.openId));
    
    if (existing.length > 0) {
      // Update existing user
      const updateData: any = {};
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updateData.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateData.role = user.role;
      updateData.updatedAt = new Date();

      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
      await persistDb();
    } else {
      // Insert new user
      const insertData: InsertUser = {
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role || 'user',
        lastSignedIn: user.lastSignedIn || new Date(),
      };

      // Check if this is the owner
      if (user.openId === ENV.ownerOpenId) {
        insertData.role = 'admin';
      }

      await db.insert(users).values(insertData);
      await persistDb();
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  } catch (err) {
    console.error("[Database] Failed query getUserByEmail:", err);
    throw err;
  }
}

export async function getUserProfileByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(user_profiles)
    .where(eq(user_profiles.cpf, cpf));
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserAccount(userId: number, data: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(users).set({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
  await persistDb();
  return result;
}

export async function createLocalUser(params: { name: string; email: string; passwordHash: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local:${params.email.toLowerCase()}`;
  const existing = await db.select().from(users).where(eq(users.openId, openId));
  if (existing.length > 0) {
    throw new Error("Usuário já cadastrado");
  }
  await db.insert(users).values({
    openId,
    name: params.name,
    email: params.email,
    passwordHash: params.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  } as any);
  await persistDb();
}

// ===== JOBS =====
export async function getJobs(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(jobs);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 200));
  return rows.slice(safeOffset, safeOffset + safeLimit);
}

export async function getJobById(jobId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId));
  return result.length > 0 ? result[0] : undefined;
}

export async function searchJobs(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(jobs)
    .where(like(jobs.title, `%${query}%`));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 200));
  return rows.slice(0, safeLimit);
}

export async function createJob(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobs).values(data);
  await persistDb();
  return result;
}

// ===== COURSES =====
export type CourseUpsertInput = {
  id: string;
  title: string;
  description?: string | null;
  provider: string;
  category?: string | null;
  priceLabel: string;
  rating?: number | null;
  url: string;
  imageUrl?: string | null;
  skills?: string[];
  workload?: string | null;
  estimatedTime?: string | null;
  certification?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const toCourseValues = (input: CourseUpsertInput) => {
  const now = new Date();
  const createdAt = input.createdAt ?? now;
  const updatedAt = input.updatedAt ?? now;
  return {
    id: input.id,
    title: input.title,
    description: input.description ?? null,
    provider: input.provider,
    category: input.category ?? null,
    priceLabel: input.priceLabel,
    rating: input.rating ?? null,
    url: input.url,
    imageUrl: input.imageUrl ?? null,
    skills: JSON.stringify((input.skills ?? []).filter((item) => item.trim().length > 0)),
    workload: input.workload ?? null,
    estimatedTime: input.estimatedTime ?? null,
    certification: Boolean(input.certification),
    createdAt,
    updatedAt,
  };
};

export async function upsertCourses(inputs: CourseUpsertInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  for (const input of inputs) {
    const values = toCourseValues({ ...input, createdAt: now, updatedAt: now });
    await db
      .insert(courses)
      .values(values as any)
      .onConflictDoUpdate({
        target: courses.id,
        set: {
          title: values.title,
          description: values.description,
          provider: values.provider,
          category: values.category,
          priceLabel: values.priceLabel,
          rating: values.rating,
          url: values.url,
          imageUrl: values.imageUrl,
          skills: values.skills,
          workload: values.workload,
          estimatedTime: values.estimatedTime,
          certification: values.certification,
          updatedAt: now,
        } as any,
      });
  }

  await persistDb();
}

export async function getCourses(limit = 20, offset = 0): Promise<DbCourseRecord[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(courses).limit(limit).offset(offset);
  return rows.map(mapCourseRow);
}

export async function getCourseById(courseId: string): Promise<DbCourseRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, courseId));
  return result.length > 0 ? mapCourseRow(result[0]) : undefined;
}

export async function getCourseByUrl(url: string): Promise<DbCourseRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.url, url));
  return result.length > 0 ? mapCourseRow(result[0]) : undefined;
}

export async function getCoursesByIds(ids: string[]): Promise<DbCourseRecord[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(courses).where(inArray(courses.id, ids));
  return rows.map(mapCourseRow);
}

export async function touchCourseUpdated(courseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(courses)
    .set({ updatedAt: new Date() })
    .where(eq(courses.id, courseId));
  await persistDb();
}

export async function saveCourseForUser(userId: number, courseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  await db
    .insert(saved_courses)
    .values({
      id: `${userId}-${courseId}`,
      user_id: userId,
      course_id: courseId,
      createdAt: now,
    })
    .onConflictDoNothing();
  await persistDb();
}

export async function removeSavedCourse(userId: number, courseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(saved_courses)
    .where(and(eq(saved_courses.user_id, userId), eq(saved_courses.course_id, courseId)));
  await persistDb();
}

export async function listSavedCourses(userId: number): Promise<
  Array<{
    course: DbCourseRecord;
    savedAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      course: courses,
      savedAt: saved_courses.createdAt,
    })
    .from(saved_courses)
    .innerJoin(courses, eq(courses.id, saved_courses.course_id))
    .where(eq(saved_courses.user_id, userId))
    .orderBy(desc(saved_courses.createdAt));

  return rows.map((row) => ({
    course: mapCourseRow(row.course),
    savedAt: row.savedAt,
  }));
}

export async function isCourseSaved(userId: number, courseId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: saved_courses.id })
    .from(saved_courses)
    .where(and(eq(saved_courses.user_id, userId), eq(saved_courses.course_id, courseId)))
    .limit(1);
  return rows.length > 0;
}

export async function recordCourseRecommendations(
  userId: number,
  entries: Array<{ courseId: string; score: number | null }>,
  options: { replace?: boolean } = {}
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (options.replace) {
    await db.delete(course_recommendations).where(eq(course_recommendations.user_id, userId));
  }

  const now = new Date();
  for (const entry of entries) {
    await db
      .insert(course_recommendations)
      .values({
        user_id: userId,
        course_id: entry.courseId,
        score: entry.score ?? null,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [course_recommendations.user_id, course_recommendations.course_id],
        set: {
          score: entry.score ?? null,
          createdAt: now,
        } as any,
      });
  }

  await persistDb();
}

export async function getLatestCourseRecommendations(
  userId: number,
  limit = 10
): Promise<Array<{ course: DbCourseRecord; score: number | null }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      course: courses,
      score: course_recommendations.score,
      createdAt: course_recommendations.createdAt,
    })
    .from(course_recommendations)
    .innerJoin(courses, eq(courses.id, course_recommendations.course_id))
    .where(eq(course_recommendations.user_id, userId))
    .orderBy(desc(course_recommendations.score), desc(course_recommendations.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    course: mapCourseRow(row.course),
    score: row.score,
  }));
}

export async function clearCourseRecommendations(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(course_recommendations).where(eq(course_recommendations.user_id, userId));
  await persistDb();
}

// ===== SAVED JOBS =====
export async function getSavedJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(saved_jobs).where(eq(saved_jobs.user_id, userId));
}

export async function saveJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(saved_jobs).values({ user_id: userId, job_id: jobId });
  await persistDb();
  return res;
}

export async function removeSavedJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.delete(saved_jobs).where(
    and(eq(saved_jobs.user_id, userId), eq(saved_jobs.job_id, jobId))
  );
  await persistDb();
  return res;
}

// ===== RESUMES =====
export async function getSubmittedResumes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(submitted_resumes).where(eq(submitted_resumes.user_id, userId));
}

export async function submitResume(userId: number, jobId: number, resumeUrl: string, status: 'submitted' | 'generated' = 'submitted') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(submitted_resumes).values({
    user_id: userId,
    job_id: jobId,
    resume_url: resumeUrl,
    status,
  });
  await persistDb();
  return res;
}

export async function getSubmittedResumeCount(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return 0;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  
  const result = await db.select().from(submitted_resumes)
    .where(and(
      eq(submitted_resumes.user_id, userId),
      gte(submitted_resumes.createdAt, sinceDate)
    ));
  return result.length;
}

// ===== CHAT =====
export async function getChatMessages(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(chat_messages)
    .where(eq(chat_messages.user_id, userId));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  return rows.slice(-safeLimit);
}

export async function addChatMessage(userId: number, sender: 'user' | 'maia', content: string, attachmentUrl?: string, attachmentType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(chat_messages).values({
    user_id: userId,
    sender,
    content,
    attachment_url: attachmentUrl,
    attachment_type: attachmentType,
  });
  await persistDb();
  return res;
}

// ===== USER PROFILE =====
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(user_profiles).where(eq(user_profiles.user_id, userId));
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserProfile(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(user_profiles).values({
    user_id: userId,
    ...data,
  });
  await persistDb();
  return res;
}

export async function updateUserProfile(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.update(user_profiles).set(data).where(eq(user_profiles.user_id, userId));
  await persistDb();
  return res;
}

// ===== STATISTICS =====
export async function getUserStatistics(userId: number) {
  const db = await getDb();
  if (!db) {
    return { jobsViewed: 0, applications: 0, applicationsToday: 0, profileCompletion: 0, interviews: 0 };
  }

  const resumes = await db.select().from(submitted_resumes).where(eq(submitted_resumes.user_id, userId));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const applicationsToday = resumes.filter((resume) => {
    const createdAt =
      (resume as any).createdAt instanceof Date
        ? (resume as any).createdAt.getTime()
        : Number((resume as any).createdAt);
    return createdAt >= startOfToday.getTime();
  }).length;

  return {
    jobsViewed: 0,
    applications: resumes.length,
    applicationsToday,
    profileCompletion: 0,
    interviews: 0,
  };
}


