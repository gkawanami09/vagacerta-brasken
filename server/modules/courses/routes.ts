import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { sdk } from "../../_core/sdk";
import {
  getCourse,
  getRecommendations,
  getSavedCourses,
  removeSavedCourseForUser,
  saveCourseForUser,
  syncCourses,
} from "./controllers";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req as any);
    (req as any).user = user;
    next();
  } catch (error) {
    console.warn("[Courses][Auth] Unauthorized access attempt:", error);
    res.status(401).json({ error: "Autenticação necessária." });
  }
}

export function registerCoursesRoutes(app: Express) {
  const router = Router();

  router.get("/recommendations", requireAuth, getRecommendations);
  router.get("/saved", requireAuth, getSavedCourses);
  router.post("/:id/save", requireAuth, saveCourseForUser);
  router.delete("/:id/save", requireAuth, removeSavedCourseForUser);
  router.post("/sync", requireAuth, syncCourses);
  router.get("/:id", getCourse);

  app.use("/courses", router);
}
