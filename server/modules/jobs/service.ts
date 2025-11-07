import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  job_applications,
  job_companies,
  job_listings,
  job_matches,
  job_saved_listings,
  type JobApplication,
  type JobCompany,
  type JobListing,
  type JobMatch,
} from "../../../drizzle/schema";
import * as db from "../../db";
import { generateResumePdf } from "../../resume";
import type {
  JobCardDTO,
  JobDetailDTO,
  NormalizedJob,
  RecommendedJobDTO,
  SearchAndIngestOptions,
} from "./dto";
import { computeMatch, storeMatch } from "./matcher";
import { fetchFromProviders } from "./providers";
import { jobsSse } from "./sse";

const inMemoryCompanyCache = new Map<string, string>();
const lastSyncMap = new Map<string, number>();
const DEFAULT_SYNC_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const recentSearches = new Map<string, { q?: string; location?: string; lastSeen: number }>();
let schedulerInitialized = false;

const trackSearch = (params: { q?: string; location?: string }) => {
  const key = `${params.q ?? "*"}::${params.location ?? "*"}`;
  recentSearches.set(key, { ...params, lastSeen: Date.now() });
  if (recentSearches.size > 30) {
    const sorted = Array.from(recentSearches.entries()).sort(
      (a, b) => a[1].lastSeen - b[1].lastSeen
    );
    const [oldestKey] = sorted[0];
    recentSearches.delete(oldestKey);
  }
};

const getSchedulerQueries = () => {
  if (recentSearches.size === 0) {
    return [{ q: "tecnologia", location: undefined }];
  }
  return Array.from(recentSearches.values())
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 5);
};

export function initJobsScheduler() {
  if (schedulerInitialized) return;
  schedulerInitialized = true;
  const timer = setInterval(async () => {
    const queries = getSchedulerQueries();
    for (const query of queries) {
      try {
        await searchAndIngest({ q: query.q, location: query.location });
      } catch (error) {
        console.warn("[Jobs][Scheduler] Failed to sync", query, error);
      }
    }
  }, DEFAULT_SYNC_WINDOW_MS);
  if (typeof (timer as any)?.unref === "function") {
    (timer as any).unref();
  }
}

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCompanyName = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

async function ensureCompany(name: string, website?: string | null, logoUrl?: string | null) {
  const normalized = normalizeCompanyName(name);
  if (!normalized) return null;
  const cacheKey = normalized.toLowerCase();
  if (inMemoryCompanyCache.has(cacheKey)) {
    return inMemoryCompanyCache.get(cacheKey) ?? null;
  }

  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const existing = await database
    .select()
    .from(job_companies)
    .where(eq(job_companies.name, normalized))
    .limit(1);

  if (existing.length) {
    inMemoryCompanyCache.set(cacheKey, existing[0].id);
    return existing[0].id;
  }

  const id = nanoid();
  const now = new Date();
  await database.insert(job_companies).values({
    id,
    name: normalized,
    website: website ?? null,
    logoUrl: logoUrl ?? null,
    createdAt: now,
    updatedAt: now,
  } as Partial<JobCompany> as any);
  inMemoryCompanyCache.set(cacheKey, id);
  return id;
}

const buildListingValues = (job: NormalizedJob, companyId: string | null): Partial<JobListing> => {
  const postedAt = toDate(job.postedAt ?? undefined);

  const salaryMin =
    typeof job.salaryMin === "number" && Number.isFinite(job.salaryMin)
      ? Math.round(job.salaryMin)
      : null;
  const salaryMax =
    typeof job.salaryMax === "number" && Number.isFinite(job.salaryMax)
      ? Math.round(job.salaryMax)
      : null;

  return {
    title: job.title,
    companyId: companyId ?? undefined,
    location: job.location ?? null,
    remote: Boolean(job.remote),
    description: job.description ?? null,
    requirements: job.requirements ?? null,
    benefits: job.benefits ?? null,
    salaryMin,
    salaryMax,
    salaryLabel: job.salaryLabel ?? null,
    applyUrl: job.applyUrl,
    source: job.source,
    externalId: job.externalId ?? null,
    postedAt: postedAt ?? null,
    raw: job.raw ? JSON.stringify(job.raw) : null,
    updatedAt: new Date(),
  } as Partial<JobListing>;
};

async function upsertSingleJob(job: NormalizedJob): Promise<JobListing | null> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  if (!job.applyUrl) return null;
  const companyId = job.company ? await ensureCompany(job.company) : null;
  const values = buildListingValues(job, companyId);

  const byExternalId =
    job.externalId && job.externalId.length
      ? await database
          .select()
          .from(job_listings)
          .where(and(eq(job_listings.source, job.source), eq(job_listings.externalId, job.externalId)))
          .limit(1)
      : [];

  const byApplyUrl = await database
    .select()
    .from(job_listings)
    .where(eq(job_listings.applyUrl, job.applyUrl))
    .limit(1);

  const existing = byExternalId[0] ?? byApplyUrl[0];

  if (existing) {
    await database
      .update(job_listings)
      .set(values as Partial<JobListing> as any)
      .where(eq(job_listings.id, existing.id));

    return { ...existing, ...values, id: existing.id } as JobListing;
  }

  const id = nanoid();
  await database.insert(job_listings).values({
    ...values,
    id,
    createdAt: new Date(),
  } as Partial<JobListing> as any);

  return { ...values, id } as JobListing;
}

export async function upsertJobs(jobs: NormalizedJob[]): Promise<JobListing[]> {
  const inserted: JobListing[] = [];
  for (const job of jobs) {
    try {
      const result = await upsertSingleJob(job);
      if (result) inserted.push(result);
    } catch (error) {
      console.warn("[Jobs][Service] Failed to upsert job", job.title, error);
    }
  }

  await db.persistDatabase();
  return inserted;
}

const MATCH_EVENT_THROTTLE_MS = 1500;
const lastMatchBroadcast = new Map<string, number>();

async function computeAndStoreMatch(
  userId: number,
  job: JobListing
): Promise<JobMatch | null> {
  try {
    const match = await computeMatch(userId, job);
    const record = await storeMatch(userId, job, match);
    const key = `${userId}:${job.id}`;
    const now = Date.now();
    const last = lastMatchBroadcast.get(key) ?? 0;
    if (now - last > MATCH_EVENT_THROTTLE_MS) {
      jobsSse.broadcast(userId, {
        type: "job.matchUpdate",
        payload: { jobId: job.id, matchScore: match.score, breakdown: match.breakdown },
      });
      lastMatchBroadcast.set(key, now);
    }
    return record;
  } catch (error) {
    console.warn("[Jobs][Service] Failed to compute match", error);
    return null;
  }
}

export async function searchAndIngest(options: SearchAndIngestOptions = {}) {
  const cacheKey = `${options.q ?? "*"}:${options.location ?? ""}`;
  const now = Date.now();
  const lastSync = lastSyncMap.get(cacheKey) ?? 0;
  if (now - lastSync < DEFAULT_SYNC_WINDOW_MS) {
    return [];
  }

  const jobs = await fetchFromProviders({
    q: options.q,
    location: options.location,
    includeWeb: Boolean(options.q),
  });
  const upserted = await upsertJobs(jobs);
  lastSyncMap.set(cacheKey, Date.now());

  if (options.userId) {
    for (const job of upserted) {
      await computeAndStoreMatch(options.userId, job);
      jobsSse.broadcast(options.userId, {
        type: "job.upsert",
        payload: { id: job.id },
      });
    }
  } else {
    for (const job of upserted) {
      jobsSse.broadcastAll({ type: "job.upsert", payload: { id: job.id } });
    }
  }

  return upserted;
}

const mapToCard = (
  row: JobListing & { company?: JobCompany | null; match?: JobMatch | null }
): JobCardDTO => ({
  id: row.id,
  title: row.title,
  company: {
    id: row.company?.id ?? undefined,
    name: row.company?.name ?? "Empresa não informada",
    logoUrl: row.company?.logoUrl ?? undefined,
    website: row.company?.website ?? null,
  },
  location: row.location ?? null,
  remote: Boolean(row.remote),
  salaryLabel:
    row.salaryLabel ??
    (row.salaryMin && row.salaryMax
      ? `R$ ${row.salaryMin} - R$ ${row.salaryMax}`
      : row.salaryMin
      ? `A partir de R$ ${row.salaryMin}`
      : row.salaryMax
      ? `Até R$ ${row.salaryMax}`
      : null),
  matchScore: row.match?.score ?? 0,
  postedAt: row.postedAt ? new Date(row.postedAt).toISOString() : null,
  source: row.source as "adzuna" | "web",
});

async function collectMatches(
  database: NonNullable<Awaited<ReturnType<typeof db.getDb>>>,
  userId: number,
  limit: number
) {
  const rows = await database
    .select({ job: job_listings, company: job_companies, match: job_matches })
    .from(job_listings)
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .leftJoin(
      job_matches,
      and(eq(job_matches.jobId, job_listings.id), eq(job_matches.userId, userId))
    )
    .orderBy(desc(job_matches.score), desc(job_listings.updatedAt))
    .limit(Math.max(limit * 4, limit));

  const enriched: Array<{
    job: JobListing;
    company?: JobCompany | null;
    match?: JobMatch | null;
  }> = [];
  let shouldPersist = false;

  for (const row of rows) {
    let match = row.match ?? undefined;
    if (!match) {
      match = (await computeAndStoreMatch(userId, row.job)) ?? undefined;
      if (match) {
        shouldPersist = true;
      }
    }
    if (match) {
      enriched.push({ job: row.job, company: row.company ?? null, match });
    }
  }

  if (shouldPersist) {
    await db.persistDatabase();
  }

  enriched.sort((a, b) => {
    const scoreDiff = (b.match?.score ?? 0) - (a.match?.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const aTime = a.job.updatedAt ? new Date(a.job.updatedAt).getTime() : 0;
    const bTime = b.job.updatedAt ? new Date(b.job.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  return enriched.slice(0, limit);
}

export async function recommendJobsForUser(
  userId: number,
  options: { limit?: number } = {}
): Promise<RecommendedJobDTO[]> {
  const database = await db.getDb();
  if (!database) return [];

  const limit = Math.max(1, Math.min(options.limit ?? 6, 20));

  const mapToRecommended = (
    row: JobListing & { company?: JobCompany | null; match?: JobMatch | null }
  ): RecommendedJobDTO => {
    const card = mapToCard(row);
    return {
      ...card,
      applyUrl: row.applyUrl,
      salaryMin: row.salaryMin ?? null,
      salaryMax: row.salaryMax ?? null,
    };
  };

  const buildResult = (items: Array<{
    job: JobListing;
    company?: JobCompany | null;
    match?: JobMatch | null;
  }>) =>
    items.map((item) =>
      mapToRecommended({
        ...item.job,
        company: item.company ?? undefined,
        match: item.match ?? undefined,
      } as JobListing & { company?: JobCompany | null; match?: JobMatch | null })
    );

  let items = await collectMatches(database, userId, limit);

  if (items.length === 0) {
    await searchAndIngest({ userId });
    items = await collectMatches(database, userId, limit);
  }

  return buildResult(items);
}

const mapToDetail = (
  row: JobListing & { company?: JobCompany | null; match?: JobMatch | null }
): JobDetailDTO => ({
  id: row.id,
  title: row.title,
  company: {
    id: row.company?.id ?? undefined,
    name: row.company?.name ?? "Empresa não informada",
    logoUrl: row.company?.logoUrl ?? undefined,
    website: row.company?.website ?? null,
  },
  location: row.location ?? null,
  remote: Boolean(row.remote),
  salaryMin: row.salaryMin ?? null,
  salaryMax: row.salaryMax ?? null,
  salaryLabel: row.salaryLabel ?? null,
  description: row.description ?? null,
  requirements: row.requirements ?? null,
  benefits: row.benefits ?? null,
  postedAt: row.postedAt ? new Date(row.postedAt).toISOString() : null,
  source: row.source as "adzuna" | "web",
  applyUrl: row.applyUrl,
  matchScore: row.match?.score ?? 0,
  similar: [],
});

const buildFilters = (params: {
  q?: string;
  location?: string;
  remote?: boolean;
}) => {
  const filters = [] as any[];
  if (params.q) {
    const pattern = `%${params.q.trim().replace(/%/g, "")}%`;
    filters.push(ilike(job_listings.title, pattern));
  }
  if (params.location) {
    const pattern = `%${params.location.trim().replace(/%/g, "")}%`;
    filters.push(ilike(job_listings.location, pattern));
  }
  if (typeof params.remote === "boolean") {
    filters.push(eq(job_listings.remote, params.remote));
  }
  return filters;
};

export async function listJobs(
  userId: number,
  params: { q?: string; location?: string; remote?: boolean; limit?: number; offset?: number }
): Promise<{ total: number; items: JobCardDTO[] }> {
  const database = await db.getDb();
  if (!database) return { total: 0, items: [] };

  trackSearch({ q: params.q, location: params.location });

  const filters = buildFilters(params);
  const whereClause = filters.length
    ? filters.reduce((acc, condition) => (acc ? and(acc, condition) : condition))
    : undefined;

  const totalQuery = whereClause
    ? await database
        .select({ value: sql<number>`count(*)` })
        .from(job_listings)
        .where(whereClause)
    : await database.select({ value: sql<number>`count(*)` }).from(job_listings);

  const limit = Math.max(1, Math.min(params.limit ?? 10, 50));
  const offset = Math.max(0, params.offset ?? 0);

  const baseRowsQuery = database
    .select({
      job: job_listings,
      company: job_companies,
      match: job_matches,
    })
    .from(job_listings)
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .leftJoin(
      job_matches,
      and(eq(job_matches.jobId, job_listings.id), eq(job_matches.userId, userId))
    );

  const rows = whereClause
    ? await baseRowsQuery
        .where(whereClause)
        .orderBy(desc(job_listings.updatedAt))
        .limit(limit)
        .offset(offset)
    : await baseRowsQuery
        .orderBy(desc(job_listings.updatedAt))
        .limit(limit)
        .offset(offset);

  const items = rows.map((row) => mapToCard({
    ...row.job,
    company: row.company ?? undefined,
    match: row.match ?? undefined,
  } as JobListing & { company?: JobCompany | null; match?: JobMatch | null }));

  if (items.length === 0 && !params.q) {
    const ingested = await searchAndIngest({
      userId,
      q: params.q,
      location: params.location,
    });
    if (ingested.length > 0) {
      return listJobs(userId, params);
    }
  }

  return { total: totalQuery[0]?.value ?? 0, items };
}

export async function getJobDetail(
  userId: number,
  jobId: string
): Promise<JobDetailDTO | null> {
  const database = await db.getDb();
  if (!database) return null;

  const rows = await database
    .select({
      job: job_listings,
      company: job_companies,
      match: job_matches,
    })
    .from(job_listings)
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .leftJoin(
      job_matches,
      and(eq(job_matches.jobId, job_listings.id), eq(job_matches.userId, userId))
    )
    .where(eq(job_listings.id, jobId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const detail = mapToDetail({
    ...row.job,
    company: row.company ?? undefined,
    match: row.match ?? undefined,
  } as JobListing & { company?: JobCompany | null; match?: JobMatch | null });

  const similar = await database
    .select({
      job: job_listings,
      match: job_matches,
      company: job_companies,
    })
    .from(job_listings)
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .leftJoin(
      job_matches,
      and(eq(job_matches.jobId, job_listings.id), eq(job_matches.userId, userId))
    )
    .where(
      and(
        or(
          eq(job_listings.companyId, row.job.companyId ?? ""),
          ilike(job_listings.title, `%${row.job.title.split(" ")[0]}%`)
        ),
        ne(job_listings.id, jobId)
      )
    )
    .orderBy(desc(job_matches.score))
    .limit(5);

  detail.similar = similar
    .filter((item) => item.job.id !== jobId)
    .map((item) => ({
      id: item.job.id,
      title: item.job.title,
      company: item.company?.name ?? "Empresa não informada",
      matchScore: item.match?.score ?? 0,
      applyUrl: item.job.applyUrl,
    }));

  if (!row.match) {
    const computed = await computeAndStoreMatch(userId, row.job);
    if (computed) {
      detail.matchScore = computed.score;
    }
  }

  return detail;
}

export async function saveJobForUser(userId: number, jobId: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  await database
    .insert(job_saved_listings)
    .values({ id: nanoid(), userId, jobId, createdAt: new Date() } as any)
    .onConflictDoNothing({
      target: [job_saved_listings.userId, job_saved_listings.jobId],
    });
  await db.persistDatabase();
}

export async function removeSavedJob(userId: number, jobId: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  await database
    .delete(job_saved_listings)
    .where(and(eq(job_saved_listings.userId, userId), eq(job_saved_listings.jobId, jobId)));
  await db.persistDatabase();
}

export async function listSavedJobs(userId: number): Promise<JobCardDTO[]> {
  const database = await db.getDb();
  if (!database) return [];
  const rows = await database
    .select({
      job: job_listings,
      company: job_companies,
      match: job_matches,
    })
    .from(job_saved_listings)
    .innerJoin(job_listings, eq(job_saved_listings.jobId, job_listings.id))
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .leftJoin(
      job_matches,
      and(eq(job_matches.jobId, job_listings.id), eq(job_matches.userId, userId))
    )
    .where(eq(job_saved_listings.userId, userId))
    .orderBy(desc(job_saved_listings.createdAt));

  return rows.map((row) =>
    mapToCard({
      ...row.job,
      company: row.company ?? undefined,
      match: row.match ?? undefined,
    } as JobListing & { company?: JobCompany | null; match?: JobMatch | null })
  );
}

export async function applyToJob(userId: number, jobId: string) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");

  const jobRow = await database
    .select({
      job: job_listings,
      company: job_companies,
    })
    .from(job_listings)
    .leftJoin(job_companies, eq(job_listings.companyId, job_companies.id))
    .where(eq(job_listings.id, jobId))
    .limit(1);

  const record = jobRow[0];
  if (!record) {
    throw new Error("Vaga não encontrada");
  }

  const resume = await generateResumePdf(userId, {
    job: {
      title: record.job.title,
      company: record.company?.name,
      description: record.job.description ?? undefined,
      requirements: record.job.requirements ?? undefined,
    },
  });

  const now = new Date();

  const existing = await database
    .select()
    .from(job_applications)
    .where(and(eq(job_applications.userId, userId), eq(job_applications.jobId, jobId)))
    .limit(1);

  const id = existing[0]?.id ?? nanoid();

  await database
    .insert(job_applications)
    .values({
      id,
      userId,
      jobId,
      resumePath: resume.path,
      status: "sent",
      sentAt: now,
    } as Partial<JobApplication> as any)
    .onConflictDoUpdate({
      target: [job_applications.userId, job_applications.jobId],
      set: {
        resumePath: resume.path,
        status: "sent",
        sentAt: now,
      } as any,
    });

  await db.persistDatabase();

  return { applicationId: id, downloadUrl: resume.url };
}

export async function getApplicationForDownload(
  userId: number,
  applicationId: string
) {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const rows = await database
    .select({
      app: job_applications,
    })
    .from(job_applications)
    .where(and(eq(job_applications.id, applicationId), eq(job_applications.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return row.app;
}

export async function refreshJobs(userId: number | null, params: { q?: string; location?: string }) {
  const jobs = await fetchFromProviders({
    q: params.q,
    location: params.location,
    includeWeb: Boolean(params.q),
  });
  const upserted = await upsertJobs(jobs);
  if (userId) {
    for (const job of upserted) {
      await computeAndStoreMatch(userId, job);
      jobsSse.broadcast(userId, { type: "job.upsert", payload: { id: job.id } });
    }
  } else {
    for (const job of upserted) {
      jobsSse.broadcastAll({ type: "job.upsert", payload: { id: job.id } });
    }
  }
  return upserted.length;
}
