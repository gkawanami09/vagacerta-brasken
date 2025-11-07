import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import {
  applyToJob,
  getApplicationForDownload,
  getJobDetail,
  listJobs,
  listSavedJobs,
  refreshJobs,
  removeSavedJob,
  saveJobForUser,
  searchAndIngest,
} from "./service";
import type { JobCardDTO, JobDetailDTO } from "./dto";

const parseLimit = (value: unknown, fallback: number, max = 50) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const parseOffset = (value: unknown) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const parseRemote = (value: unknown): boolean | undefined => {
  if (typeof value !== "string") return undefined;
  if (["true", "1", "yes"].includes(value.toLowerCase())) return true;
  if (["false", "0", "no"].includes(value.toLowerCase())) return false;
  return undefined;
};

export async function listJobsController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const limit = parseLimit(req.query.limit, 10);
  const offset = parseOffset(req.query.offset);
  const remote = parseRemote(req.query.remote);
  const q = typeof req.query.q === "string" ? req.query.q.slice(0, 120) : undefined;
  const location =
    typeof req.query.location === "string" ? req.query.location.slice(0, 120) : undefined;

  try {
    const result = await listJobs(user.id, {
      q,
      location,
      remote,
      limit,
      offset,
    });

    res.json({ items: result.items as JobCardDTO[], total: result.total });
  } catch (error) {
    console.error("[Jobs][Controller] Failed to list jobs", error);
    res.status(500).json({ error: "Não foi possível carregar as vagas." });
  }
}

export async function getJobDetailController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  const jobId = String(req.params.id);

  try {
    const detail = await getJobDetail(user.id, jobId);
    if (!detail) {
      res.status(404).json({ error: "Vaga não encontrada" });
      return;
    }
    res.json(detail as JobDetailDTO);
  } catch (error) {
    console.error("[Jobs][Controller] Failed to get job detail", error);
    res.status(500).json({ error: "Não foi possível carregar a vaga." });
  }
}

export async function applyToJobController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  const jobId = String(req.params.id);

  try {
    const result = await applyToJob(user.id, jobId);
    res.json(result);
  } catch (error) {
    console.error("[Jobs][Controller] Failed to apply to job", error);
    res.status(500).json({ error: "Falha ao aplicar para a vaga." });
  }
}

export async function saveJobController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  const jobId = String(req.params.id);

  try {
    await saveJobForUser(user.id, jobId);
    res.status(204).end();
  } catch (error) {
    console.error("[Jobs][Controller] Failed to save job", error);
    res.status(500).json({ error: "Falha ao salvar vaga." });
  }
}

export async function removeSavedJobController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  const jobId = String(req.params.id);
  try {
    await removeSavedJob(user.id, jobId);
    res.status(204).end();
  } catch (error) {
    console.error("[Jobs][Controller] Failed to remove saved job", error);
    res.status(500).json({ error: "Não foi possível remover a vaga salva." });
  }
}

export async function listSavedJobsController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  try {
    const items = await listSavedJobs(user.id);
    res.json(items as JobCardDTO[]);
  } catch (error) {
    console.error("[Jobs][Controller] Failed to list saved jobs", error);
    res.status(500).json({ error: "Falha ao carregar vagas salvas." });
  }
}

export async function downloadApplicationController(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const applicationId = String(req.params.id);
  try {
    const application = await getApplicationForDownload(user.id, applicationId);
    if (!application) {
      res.status(404).json({ error: "Aplicação não encontrada" });
      return;
    }

    if (!fs.existsSync(application.resumePath)) {
      res.status(410).json({ error: "Arquivo não está mais disponível" });
      return;
    }

    res.download(application.resumePath, path.basename(application.resumePath));
  } catch (error) {
    console.error("[Jobs][Controller] Failed to download application", error);
    res.status(500).json({ error: "Falha ao baixar currículo gerado." });
  }
}

export async function refreshJobsController(req: Request, res: Response) {
  const user = (req as any).user as { id: number; role?: string } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Apenas administradores podem forçar sincronização." });
    return;
  }

  try {
    const count = await refreshJobs(user.id, {
      q: typeof req.body?.q === "string" ? req.body.q.slice(0, 120) : undefined,
      location:
        typeof req.body?.location === "string" ? req.body.location.slice(0, 120) : undefined,
    });
    res.json({ success: true, inserted: count });
  } catch (error) {
    console.error("[Jobs][Controller] Failed to refresh jobs", error);
    res.status(500).json({ error: "Falha ao sincronizar vagas." });
  }
}

export async function triggerBackgroundSync(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  try {
    await searchAndIngest({
      userId: user.id,
      q: typeof req.query.q === "string" ? req.query.q.slice(0, 120) : undefined,
      location:
        typeof req.query.location === "string" ? req.query.location.slice(0, 120) : undefined,
      remote: parseRemote(req.query.remote),
    });
    res.status(202).json({ enqueued: true });
  } catch (error) {
    console.error("[Jobs][Controller] Failed to trigger async sync", error);
    res.status(500).json({ error: "Falha ao iniciar sincronização." });
  }
}
