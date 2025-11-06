import { eq, and, gte, lte, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { InsertUser, users, jobs, courses, saved_jobs, submitted_resumes, chat_messages, user_profiles } from "../drizzle/schema";
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
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        skills TEXT,
        duration_hours INTEGER,
        price INTEGER,
        is_free INTEGER DEFAULT 1,
        certification INTEGER DEFAULT 0,
        provider TEXT,
        thumbnail TEXT,
        external_url TEXT,
        recommended_for_user INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now')*1000)
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
    _db = drizzle(_sqlJsDb);
  })();
  return _initPromise;
}

async function persistDb() {
  if (!_sqlJsDb || !_dbFilePath) return;
  const data = _sqlJsDb.export();
  await fs.promises.writeFile(_dbFilePath, Buffer.from(data));
}

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
export async function getCourses(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courses).limit(limit).offset(offset);
}

export async function getCourseById(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, courseId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getRecommendedCourses(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courses)
    .where(eq(courses.recommended_for_user, true))
    .limit(limit);
}

export async function createCourse(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(data);
  return result;
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
  if (!db) return { jobsViewed: 0, applications: 0, profileCompletion: 0, interviews: 0 };

  const resumes = await db.select().from(submitted_resumes).where(eq(submitted_resumes.user_id, userId));
  const profile = await getUserProfile(userId);

  let profileCompletion = 0;
  if (profile) {
    let completed = 0;
    if (profile.phone) completed++;
    if (profile.cpf) completed++;
    if (profile.location) completed++;
    if (profile.work_modality) completed++;
    if (profile.salary_expectation) completed++;
    if (profile.resume_url) completed++;
    profileCompletion = Math.round((completed / 6) * 100);
  }

  // Contagem de "chamadas"/candidaturas por dia (hoje)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const applicationsToday = resumes.filter(r => {
    const ts = (r as any).createdAt instanceof Date ? (r as any).createdAt.getTime() : Number((r as any).createdAt);
    return ts >= startOfToday.getTime();
  }).length;

  return {
    jobsViewed: 0, // sem rastreamento de visualizações, manter 0 para não induzir erro
    applications: resumes.length,
    applicationsToday,
    profileCompletion,
    interviews: 0, // sem rastreamento de entrevistas, manter 0
  };
}
