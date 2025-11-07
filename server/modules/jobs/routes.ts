import type { Express, NextFunction, Request, Response } from "express";
import { Router } from "express";
import { sdk } from "../../_core/sdk";
import {
  applyToJobController,
  downloadApplicationController,
  getJobDetailController,
  listJobsController,
  listSavedJobsController,
  refreshJobsController,
  removeSavedJobController,
  saveJobController,
  triggerBackgroundSync,
} from "./controllers";
import { initJobsScheduler } from "./service";
import { registerJobsStream } from "./sse";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req as any);
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Autenticação necessária." });
  }
}

export function registerJobsRoutes(app: Express) {
  const router = Router();
  initJobsScheduler();

  router.use(requireAuth);
  router.get("/", listJobsController);
  router.get("/stream", registerJobsStream);
  router.get("/saved", listSavedJobsController);
  router.post("/refresh", refreshJobsController);
  router.post("/sync", triggerBackgroundSync);
  router.get("/:id", getJobDetailController);
  router.post("/:id/apply", applyToJobController);
  router.post("/:id/save", saveJobController);
  router.delete("/:id/save", removeSavedJobController);

  app.use("/jobs", router);
  app.get("/applications/:id/download", requireAuth, downloadApplicationController);
}
