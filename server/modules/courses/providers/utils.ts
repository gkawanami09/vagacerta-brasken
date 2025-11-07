import crypto from "crypto";

export const DEFAULT_TIMEOUT_MS = 15000;

export function createCourseId(provider: string, url: string): string {
  const hash = crypto.createHash("sha1").update(`${provider}:${url}`).digest("hex");
  return `${provider}:${hash}`;
}

export function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

export function normalizePrice(label?: string | null): string {
  const cleaned = cleanText(label ?? "");
  if (!cleaned) return "Não informado";
  if (/gratuito|free/i.test(cleaned)) return "Gratuito";
  if (/^\$?\d+(?:[.,]\d{2})?$/.test(cleaned)) return `US$ ${cleaned.replace(/^\$/, "")}`;
  if (/R\$/.test(cleaned)) return cleaned.replace(/\s+/g, " ");
  if (/^\d+/.test(cleaned)) return `R$ ${cleaned}`;
  return cleaned;
}

export function parseHours(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = cleanText(value).match(/([\d.,]+)\s*(?:total\s+)?hours?/i);
  if (match) {
    const amount = match[1].replace(",", ".");
    return `${amount} horas`;
  }
  return undefined;
}

export async function fetchText(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<string> {
  const controller = new AbortController();
  const timeout = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "user-agent":
          init?.headers && "user-agent" in init.headers
            ? (init.headers as any)["user-agent"]
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        accept: "text/html,application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export function extractMarkdownSection(html: string): string {
  const marker = "Markdown Content:";
  const idx = html.indexOf(marker);
  if (idx === -1) return html;
  return html.slice(idx + marker.length).trim();
}

export function dedupeByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = item.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function sanitizeSkills(skills: string[]): string[] {
  return Array.from(
    new Set(
      skills
        .map((skill) => cleanText(skill))
        .filter(Boolean)
        .map((skill) => skill.replace(/^[#•-]\s*/, ""))
    )
  ).slice(0, 12);
}

const PREFERRED_JSON_KEYS = ["title", "name", "summary", "headline", "description", "text"];

function extractStringFromJson(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractStringFromJson(item);
      if (extracted) return extracted;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of PREFERRED_JSON_KEYS) {
      if (key in obj) {
        const extracted = extractStringFromJson(obj[key]);
        if (extracted) return extracted;
      }
    }
    for (const entry of Object.values(obj)) {
      const extracted = extractStringFromJson(entry);
      if (extracted) return extracted;
    }
  }
  return undefined;
}

export function extractMeaningfulText(value?: string | null): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  let candidate = trimmed;
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      const extracted = extractStringFromJson(parsed);
      if (typeof extracted === "string") {
        candidate = extracted;
      }
    } catch {
      candidate = trimmed;
    }
  }

  candidate = candidate
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, "$1")
    .replace(/\[[0-9]+\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/•/g, " ")
    .replace(/-\s+/g, " ")
    .replace(/\s+/g, " ");

  return cleanText(candidate);
}
