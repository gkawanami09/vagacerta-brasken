import type { Request, Response } from "express";
import { EventEmitter } from "events";

type JobsEvent =
  | { type: "job.upsert"; payload: unknown }
  | { type: "job.matchUpdate"; payload: unknown };

type Client = {
  res: Response;
  userId: number;
};

class JobsSse extends EventEmitter {
  private clients = new Map<number, Set<Client>>();

  constructor() {
    super();
  }

  attach(userId: number, res: Response) {
    const client: Client = { res, userId };
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("\n");

    const bucket = this.clients.get(userId) ?? new Set<Client>();
    bucket.add(client);
    this.clients.set(userId, bucket);

    const onClose = () => {
      this.removeClient(userId, client);
    };

    res.on("close", onClose);
    res.on("finish", onClose);
  }

  private removeClient(userId: number, client: Client) {
    const bucket = this.clients.get(userId);
    if (!bucket) return;
    bucket.delete(client);
    if (bucket.size === 0) {
      this.clients.delete(userId);
    }
  }

  broadcast(userId: number, event: JobsEvent) {
    const bucket = this.clients.get(userId);
    if (!bucket || bucket.size === 0) return;

    const serialized = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
    for (const client of Array.from(bucket)) {
      try {
        client.res.write(serialized);
      } catch (error) {
        console.warn("[Jobs][SSE] Failed to push event:", error);
        this.removeClient(userId, client);
      }
    }
  }

  broadcastAll(event: JobsEvent) {
    for (const userId of Array.from(this.clients.keys())) {
      this.broadcast(userId, event);
    }
  }
}

export const jobsSse = new JobsSse();

export function registerJobsStream(req: Request, res: Response) {
  const user = (req as any).user as { id: number } | undefined;
  if (!user) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  jobsSse.attach(user.id, res);
}
