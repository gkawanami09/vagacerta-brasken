import type { Express, Request, Response } from "express";
import { invokeLLM } from "./llm";

export function registerLlmDiagRoutes(app: Express) {
  app.get("/api/llm/ping", async (req: Request, res: Response) => {
    try {
      const result = await invokeLLM({
        messages: [
          { role: "system" as const, content: "Você é um healthcheck." },
          { role: "user" as const, content: "Diga OK" },
        ],
      });
      const text = String(result.choices?.[0]?.message?.content ?? "");
      res.json({ ok: true, content: text.slice(0, 200) });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });
}

