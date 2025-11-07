import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { JobListing, JobMatch } from "../../../drizzle/schema";
import { job_matches } from "../../../drizzle/schema";
import * as db from "../../db";
import { getResumeCompletionStatus } from "../../resume";
import type { MatchComputationResult } from "./dto";

const normalizeText = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const tokenize = (value: string): string[] =>
  value
    .split(/[^a-z0-9+]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

const extractUserSkills = (payload: any): string[] => {
  const skills = new Set<string>();
  if (Array.isArray(payload?.habilidades)) {
    for (const item of payload.habilidades) {
      if (typeof item === "string" && item.trim().length) {
        skills.add(normalizeText(item));
      }
    }
  }

  if (Array.isArray(payload?.experiencias)) {
    for (const exp of payload.experiencias) {
      const responsibilities = Array.isArray(exp?.responsabilidades)
        ? exp.responsabilidades
        : [];
      for (const responsibility of responsibilities) {
        if (typeof responsibility === "string" && responsibility.trim().length) {
          tokenize(responsibility).forEach((token) => skills.add(token));
        }
      }
    }
  }

  if (Array.isArray(payload?.formacao)) {
    for (const course of payload.formacao) {
      if (typeof course === "string" && course.trim().length) {
        tokenize(course).forEach((token) => skills.add(token));
      }
    }
  }

  return Array.from(skills).slice(0, 80);
};

const inferSeniorityFromTitle = (title: string): "junior" | "pleno" | "senior" | "other" => {
  const normalized = normalizeText(title);
  if (/estagio|intern/i.test(normalized)) return "junior";
  if (/junior|jr\b/.test(normalized)) return "junior";
  if (/pleno|mid|middle|ii\b/.test(normalized)) return "pleno";
  if (/senior|sr\b|principal|lead/.test(normalized)) return "senior";
  return "other";
};

const matchSeniority = (jobTitle: string, interests: string[]): number => {
  const jobLevel = inferSeniorityFromTitle(jobTitle);
  if (jobLevel === "other") return 7;
  const patterns = interests.map((interest) => normalizeText(interest));
  if (
    jobLevel === "junior" &&
    patterns.some((item) => /junior|jr|inicio|estagio/.test(item))
  )
    return 10;
  if (
    jobLevel === "pleno" &&
    patterns.some((item) => /pleno|mid|ii|experiencia/.test(item))
  )
    return 10;
  if (
    jobLevel === "senior" &&
    patterns.some((item) => /senior|sr|lead|lider/.test(item))
  )
    return 10;
  return 6;
};

const computeLocationScore = (
  job: JobListing,
  userLocation?: string | null,
  preferredModality?: string | null
): number => {
  if (job.remote) return 15;
  const jobLocation = normalizeText(job.location ?? "");
  const userLoc = normalizeText(userLocation ?? "");
  if (!jobLocation) return 8;
  if (userLoc && jobLocation.includes(userLoc)) return 15;
  if (userLoc && jobLocation.split(/[,-]/).some((part) => part.trim() && userLoc.includes(part.trim()))) {
    return 12;
  }

  if (preferredModality && /remoto|hibrido/.test(normalizeText(preferredModality))) {
    return 10;
  }

  return 5;
};

export async function computeMatch(
  userId: number,
  job: JobListing
): Promise<MatchComputationResult> {
  const [profile, resumeStatus] = await Promise.all([
    db.getUserProfile(userId),
    getResumeCompletionStatus(userId).catch((error) => {
      console.warn("[Jobs][Match] Failed to get resume status:", error);
      return null;
    }),
  ]);

  const resumeData = (resumeStatus?.data ?? {}) as any;
  const userSkills = extractUserSkills(resumeData);
  const interestRaw = profile?.areas_of_interest;
  const interests: string[] = Array.isArray(interestRaw)
    ? interestRaw
    : typeof interestRaw === "string" && interestRaw.trim().startsWith("[")
    ? (() => {
        try {
          const parsed = JSON.parse(interestRaw);
          return Array.isArray(parsed)
            ? parsed
                .map((item) => (typeof item === "string" ? item : ""))
                .filter(Boolean)
            : [];
        } catch {
          return [];
        }
      })()
    : typeof interestRaw === "string"
    ? interestRaw.split(/[,;]+/).map((part) => part.trim())
    : [];

  const jobText = normalizeText(
    `${job.requirements ?? ""} ${job.description ?? ""} ${job.title}`
  );
  const tokens = new Set(tokenize(jobText));

  const matchedSkillCount = userSkills.filter((skill) => tokens.has(skill)).length;
  const skillScore = userSkills.length
    ? Math.min(1, matchedSkillCount / Math.max(1, userSkills.length / 2)) * 60
    : matchedSkillCount > 0
    ? 40
    : 30;

  const locationScore = computeLocationScore(job, profile?.location, profile?.work_modality);

  const roleMatch = interests.some((interest) =>
    jobText.includes(normalizeText(interest))
  )
    ? 10
    : 6;

  const seniorityScore = matchSeniority(job.title, interests);

  const extrasScore = Array.isArray(resumeData?.idiomas) && resumeData.idiomas.length ? 5 : 3;

  const total = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        skillScore + locationScore + seniorityScore + roleMatch + extrasScore
      )
    )
  );

  return {
    score: total,
    breakdown: {
      skills: Math.round(skillScore),
      location: locationScore,
      seniority: seniorityScore,
      role: roleMatch,
      extras: extrasScore,
    },
  };
}

export async function storeMatch(
  userId: number,
  job: JobListing,
  result: MatchComputationResult
): Promise<JobMatch> {
  const database = await db.getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const id = nanoid();
  const existing = await database
    .select()
    .from(job_matches)
    .where(and(eq(job_matches.userId, userId), eq(job_matches.jobId, job.id)))
    .limit(1);

  const payload = {
    score: result.score,
    factors: JSON.stringify(result.breakdown),
    updatedAt: new Date(),
  } as const;

  if (existing.length) {
    await database
      .update(job_matches)
      .set(payload as any)
      .where(and(eq(job_matches.userId, userId), eq(job_matches.jobId, job.id)));
    return { ...existing[0], ...payload } as JobMatch;
  }

  await database.insert(job_matches).values({
    id,
    userId,
    jobId: job.id,
    ...payload,
  } as any);

  return {
    id,
    userId,
    jobId: job.id,
    ...payload,
  } as JobMatch;
}
