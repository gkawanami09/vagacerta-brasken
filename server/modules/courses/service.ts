import type { Request } from "express";
import { ENV } from "../../_core/env";
import * as db from "../../db";
import type { DbCourseRecord } from "../../db";
import { mapCourseToListItem, mapDetailToResponse } from "./dto";
import type {
  CourseDetailData,
  CourseDetailResponse,
  CourseListItem,
  CourseRecommendationResponse,
  NormalizedCourse,
  RecommendationCandidate,
} from "./types";
import { searchProviders, getProviderDetail } from "./providers";
import { cleanText, sanitizeSkills, extractMeaningfulText, normalizePrice } from "./providers/utils";
import { getResumeCompletionStatus, type ResumeData } from "../../resume";

const CACHE_TTL_MS = ENV.coursesCacheTtlMs ?? 15 * 60 * 1000;
const queryCache = new Map<string, { timestamp: number; courses: NormalizedCourse[] }>();
const FALLBACK_QUERIES = [
  "curso de oratoria online",
  "ingles para profissionais",
  "curso de comunicacao profissional",
  "curso de produtividade pessoal",
  "curso de gestao do tempo",
];

type RecommendOptions = {
  q?: string;
  jobId?: number;
  limit?: number;
  targetRole?: string;
};

function addCacheEntry(key: string, courses: NormalizedCourse[]) {
  queryCache.set(key, { timestamp: Date.now(), courses });
}

function pickFromCache(key: string): NormalizedCourse[] | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  return cached.courses;
}

function tokenize(value: string | null | undefined): string[] {
  if (!value) return [];
  return cleanText(value)
    .toLowerCase()
    .split(/[,/\\|;•\-–\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 20);
}

async function resolveSearchQueries(
  userId: number,
  opts: RecommendOptions,
  resumeData?: ResumeData | null
): Promise<string[]> {
  const terms = new Set<string>();
  if (opts.q) terms.add(cleanText(opts.q));
  if (opts.targetRole) terms.add(cleanText(opts.targetRole));

  const profile = await db.getUserProfile(userId);
  if (profile?.areas_of_interest) {
    try {
      const parsed: unknown = JSON.parse(profile.areas_of_interest);
      if (Array.isArray(parsed)) {
        parsed.slice(0, 6).forEach((term) => {
          if (typeof term === "string") terms.add(cleanText(term));
        });
      }
    } catch {
      tokenize(profile.areas_of_interest).forEach((term) => terms.add(term));
    }
  }

  if (profile?.work_modality) terms.add(cleanText(profile.work_modality));
  if (profile?.location) terms.add(cleanText(profile.location));

  if (resumeData) {
    const addTerm = (value: unknown) => {
      if (!value) return;
      const text = cleanText(String(value));
      if (text) terms.add(text);
    };
    addTerm(resumeData.objetivo);
    addTerm(resumeData.resumo);

    if (Array.isArray(resumeData.habilidades)) {
      resumeData.habilidades.slice(0, 10).forEach(addTerm);
    }

    if (Array.isArray(resumeData.formacao)) {
      resumeData.formacao.slice(0, 5).forEach(addTerm);
    }

    if (Array.isArray(resumeData.experiencias)) {
      resumeData.experiencias.slice(0, 6).forEach((exp) => {
        if (exp && typeof exp === "object") {
          addTerm((exp as any).cargo);
          addTerm((exp as any).empresa);
          if (Array.isArray((exp as any).responsabilidades)) {
            (exp as any).responsabilidades.slice(0, 3).forEach(addTerm);
          }
          if (Array.isArray((exp as any).resultados)) {
            (exp as any).resultados.slice(0, 3).forEach(addTerm);
          }
        }
      });
    }
  }

  if (opts.jobId) {
    const job = await db.getJobById(opts.jobId);
    if (job?.title) terms.add(cleanText(job.title));
    tokenize(job?.requirements).forEach((term) => terms.add(term));
  }

  const final = Array.from(terms).filter(Boolean);
  return final.slice(0, 5);

}

async function fetchCoursesForQuery(query: string): Promise<NormalizedCourse[]> {
  const cached = pickFromCache(query);
  if (cached) return cached;

    const courses = await searchProviders(query, { limit: 20 });
  if (courses.length) {
    const records = courses.map((course) => ({
      id: course.id,
      title: extractMeaningfulText(course.title) || "Curso",
      description:
        extractMeaningfulText(course.summary || (course as any).description) ||
        "Curso disponivel para consulta.",
      provider: extractMeaningfulText(course.provider) || "Curso",
      category: extractMeaningfulText(course.category) || null,
      priceLabel: normalizePrice(course.priceLabel),
      rating: course.rating ?? null,
      url: course.url,
      imageUrl: course.imageUrl ?? null,
      skills: Array.isArray(course.skills)
        ? course.skills.map((skill) => extractMeaningfulText(skill)).filter(Boolean)
        : [],
      workload: extractMeaningfulText((course as any).workload) || null,
      estimatedTime: extractMeaningfulText((course as any).estimatedTime) || null,
      certification: course.certification ?? false,
    }));
    await db.upsertCourses(records);
  }

  addCacheEntry(query, courses);
  return courses;
}

function buildCandidateScore(
  course: NormalizedCourse,
  contextTerms: string[],
  resumeTerms: string[]
): RecommendationCandidate & { resumeScore: number; resumeMatches: string[] } {
  const title = course.title.toLowerCase();
  const summary = course.summary.toLowerCase();
  let termScore = 0;
  const reasons: string[] = [];

  for (const term of contextTerms) {
    if (!term) continue;
    if (title.includes(term)) {
      termScore += 12;
      reasons.push(`Título menciona "${term}"`);
    } else if (summary.includes(term)) {
      termScore += 7;
      reasons.push(`Descrição aborda "${term}"`);
    } else if (course.skills.some((skill) => skill.toLowerCase().includes(term))) {
      termScore += 5;
      reasons.push(`Habilidade relacionada: ${term}`);
    }
  }

  let resumeScore = 0;
  const resumeMatches: string[] = [];
  if (resumeTerms.length) {
    for (const term of resumeTerms) {
      if (!term) continue;
      if (title.includes(term) || summary.includes(term) || course.skills.some((skill) => skill.toLowerCase().includes(term))) {
        resumeScore += 10;
        resumeMatches.push(term);
      }
    }
    if (!resumeMatches.length) {
      resumeScore -= 8;
    }
  }

  const providerBoost = course.provider === "Udemy" ? 3 : course.provider === "Coursera" ? 4 : 2;
  const ratingScore = (course.rating ?? 0) * 2;
  const priceScore = /gratuito|assinatura/i.test(course.priceLabel) ? 4 : 1;

  const score = Math.round(termScore + resumeScore + providerBoost + ratingScore + priceScore);

  return {
    ...course,
    score,
    reasons,
    resumeScore,
    resumeMatches,
  };
}

function toListItem(course: RecommendationCandidate): CourseListItem {
  return {
    ...mapCourseToListItem(course),
    certificacao: course.certification,
  };
}

function normalizeDbCourse(record: DbCourseRecord): NormalizedCourse {
  const title = extractMeaningfulText(record.title) || "Curso";
  const summary = extractMeaningfulText(record.description) || "Curso disponivel para consulta.";
  const provider = extractMeaningfulText(record.provider) || "Curso";
  const priceLabel = normalizePrice(record.priceLabel);
  const skills = Array.isArray(record.skills)
    ? record.skills.map((skill) => extractMeaningfulText(skill)).filter(Boolean)
    : [];
  const workload = record.workload ? extractMeaningfulText(record.workload) : undefined;
  const estimatedTime = record.estimatedTime ? extractMeaningfulText(record.estimatedTime) : undefined;

  return {
    id: record.id,
    title,
    summary,
    url: record.url,
    imageUrl: record.imageUrl ?? undefined,
    provider,
    category: undefined,
    priceLabel,
    rating: record.rating ?? undefined,
    skills,
    workload,
    estimatedTime,
    certification: Boolean(record.certification),
  };
}


export async function recommendForUser(
  userId: number,
  opts: RecommendOptions = {}
): Promise<CourseRecommendationResponse> {
  const limit = opts.limit ?? 10;
  const existing = await db.getLatestCourseRecommendations(userId, limit);

  const resumeStatus = await getResumeCompletionStatus(userId).catch(() => null);
  const resumeData = resumeStatus?.data ?? null;
  const resumeCompletion = resumeStatus?.completion ?? 0;

  const formatExisting = () =>
    existing.map(({ course }) => mapCourseToListItem(normalizeDbCourse(course)));

  if (!resumeData || resumeCompletion < 30) {
    if (existing.length) {
      return { recommended: formatExisting() };
    }
    await db.recordCourseRecommendations(userId, [], { replace: true });
    return { recommended: [] };
  }

  const queries = await resolveSearchQueries(userId, opts, resumeData);
  if (!queries.length) {
    if (existing.length) {
      return { recommended: formatExisting() };
    }
    await db.recordCourseRecommendations(userId, [], { replace: true });
    return { recommended: [] };
  }

  const contextTerms = sanitizeSkills(queries.map((term) => cleanText(term.toLowerCase())));

  const resumeKeywordsSource: string[] = [];
  const addResumeKeyword = (value: unknown) => {
    if (!value) return;
    const text = cleanText(String(value));
    if (text) resumeKeywordsSource.push(text);
  };

  addResumeKeyword(resumeData.objetivo);
  addResumeKeyword(resumeData.resumo);
  if (Array.isArray(resumeData.habilidades)) {
    resumeData.habilidades.forEach(addResumeKeyword);
  }
  if (Array.isArray(resumeData.experiencias)) {
    resumeData.experiencias.forEach((exp) => {
      if (exp && typeof exp === "object") {
        addResumeKeyword((exp as any).cargo);
        addResumeKeyword((exp as any).empresa);
        if (Array.isArray((exp as any).responsabilidades)) {
          (exp as any).responsabilidades.forEach(addResumeKeyword);
        }
        if (Array.isArray((exp as any).resultados)) {
          (exp as any).resultados.forEach(addResumeKeyword);
        }
      }
    });
  }

  const resumeTerms = sanitizeSkills(resumeKeywordsSource);
  const fetched: NormalizedCourse[] = [];
  for (const q of queries) {
    const results = await fetchCoursesForQuery(q);
    for (const course of results) {
      if (course) fetched.push(course);
    }
  }

  const unique = new Map<string, RecommendationCandidate>();
  for (const course of fetched) {
    const candidate = buildCandidateScore(course, contextTerms, resumeTerms);
    if (resumeTerms.length && (candidate.resumeScore ?? 0) <= 0) {
      continue;
    }
    const existingCandidate = unique.get(candidate.id);
    if (!existingCandidate || candidate.score > existingCandidate.score) {
      unique.set(candidate.id, candidate);
    }
  }

  const sorted = Array.from(unique.values()).sort((a, b) => b.score - a.score);
  let selected = sorted.slice(0, limit);

  if (resumeTerms.length && selected.length === 0) {
    selected = Array.from(unique.values())
      .sort((a, b) => (b.resumeScore ?? 0) - (a.resumeScore ?? 0))
      .slice(0, limit);
  }

  if (selected.length === 0) {
    for (const fallbackQuery of FALLBACK_QUERIES) {
      const fallbackResults = await fetchCoursesForQuery(fallbackQuery);
      for (const course of fallbackResults) {
        const candidate = buildCandidateScore(course, contextTerms, []);
        const existingCandidate = unique.get(candidate.id);
        if (!existingCandidate || candidate.score > existingCandidate.score) {
          unique.set(candidate.id, candidate);
        }
      }
    }

    selected = Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  if (selected.length === 0) {
    if (existing.length) {
      return { recommended: formatExisting() };
    }
    await db.recordCourseRecommendations(userId, [], { replace: true });
    return { recommended: [] };
  }

  await db.recordCourseRecommendations(
    userId,
    selected.map((course) => ({ courseId: course.id, score: course.score })),
    { replace: true }
  );

  return {
    recommended: selected.map(toListItem),
  };
}export async function getCourseDetail(courseId: string): Promise<CourseDetailResponse | null> {
  const dbCourse = await db.getCourseById(courseId);
  if (!dbCourse) return null;

  const normalized = normalizeDbCourse(dbCourse);

  let detail: CourseDetailData | null = await getProviderDetail(normalized);
  if (!detail) {
    detail = {
      id: normalized.id,
      title: normalized.title,
      summary: normalized.summary,
      description: normalized.summary,
      url: normalized.url,
      imageUrl: normalized.imageUrl,
      provider: normalized.provider,
      rating: normalized.rating,
      priceLabel: normalized.priceLabel,
      skills: normalized.skills,
      workload: normalized.workload,
      estimatedTime: normalized.estimatedTime,
      certification: normalized.certification,
      similar: [],
    };
  }

  return mapDetailToResponse(detail);
}

export async function saveCourse(userId: number, courseId: string): Promise<void> {
  await db.saveCourseForUser(userId, courseId);
}

export async function removeSavedCourse(userId: number, courseId: string): Promise<void> {
  await db.removeSavedCourse(userId, courseId);
}

export async function listSavedCourses(userId: number): Promise<CourseListItem[]> {
  const saved = await db.listSavedCourses(userId);
  return saved.map(({ course }) => mapCourseToListItem(normalizeDbCourse(course)));
}

export async function createTrackingLink(
  _userId: number,
  _courseId: string
): Promise<{ link: string } | null> {
  return null;
}

export async function syncCoursesForQueries(queries: string[]): Promise<{ imported: number }> {
  let total = 0;
  for (const query of queries) {
    const courses = await fetchCoursesForQuery(query);
    total += courses.length;
  }
  return { imported: total };
}

export async function publishResumeGenerated(userId: number): Promise<void> {
  try {
    const recommendations = await recommendForUser(userId, { limit: 5 });
    if (!recommendations.recommended.length) return;

    const summaryLines = recommendations.recommended.slice(0, 3).map((course) => {
      return `• ${course.titulo} (${course.plataforma}) — ${course.preco}`;
    });

    const message = [
      "Acabei de analisar o seu currículo atualizado e separei alguns cursos que podem turbinar suas habilidades:",
      ...summaryLines,
      "Você confere a lista completa e os detalhes no painel de Relatórios › Cursos Recomendados.",
    ].join("\n");

    await db.addChatMessage(userId, "maia", message);
  } catch (error) {
    console.warn("[Courses] Falha ao publicar recomendação pós-resume:", error);
  }
}

export function extractUserFromRequest(req: Request) {
  return (req as any).user as Awaited<ReturnType<typeof db.getUserById>> | undefined;
}












