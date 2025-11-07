import type { Request, Response } from "express";
import { recommendForUser, getCourseDetail, saveCourse, listSavedCourses, removeSavedCourse, syncCoursesForQueries } from "./service";
import type { CourseRecommendationResponse } from "./types";

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function getRecommendations(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const limit = parseNumber(req.query.limit);
    const jobId = parseNumber(req.query.jobId);
    const result = await recommendForUser(user.id, {
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      limit,
      jobId,
      targetRole: typeof req.query.targetRole === "string" ? req.query.targetRole : undefined,
    });
    res.json(result satisfies CourseRecommendationResponse);
  } catch (error) {
    console.error("[Courses][recommendations] Failed:", error);
    res.status(500).json({ error: "Falha ao gerar recomendações de cursos." });
  }
}

export async function getCourse(req: Request, res: Response) {
  try {
    const detail = await getCourseDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: "Curso não encontrado." });
    res.json(detail);
  } catch (error) {
    console.error("[Courses][detail] Failed:", error);
    res.status(500).json({ error: "Falha ao carregar detalhes do curso." });
  }
}

export async function saveCourseForUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    await saveCourse(user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error("[Courses][save] Failed:", error);
    res.status(500).json({ error: "Falha ao salvar o curso." });
  }
}

export async function removeSavedCourseForUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    await removeSavedCourse(user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error("[Courses][remove] Failed:", error);
    res.status(500).json({ error: "Falha ao remover curso salvo." });
  }
}

export async function getSavedCourses(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await listSavedCourses(user.id);
    res.json({ items: result });
  } catch (error) {
    console.error("[Courses][saved] Failed:", error);
    res.status(500).json({ error: "Falha ao listar cursos salvos." });
  }
}

export async function syncCourses(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Apenas administradores podem sincronizar cursos." });
    }
    const body = (req.body ?? {}) as { terms?: string[] };
    const terms = Array.isArray(body.terms) && body.terms.length ? body.terms : ["react", "javascript", "typescript"];
    const report = await syncCoursesForQueries(terms.map((term) => term.trim()).filter(Boolean));
    res.json({ success: true, ...report });
  } catch (error) {
    console.error("[Courses][sync] Failed:", error);
    res.status(500).json({ error: "Falha ao sincronizar catálogos de cursos." });
  }
}
