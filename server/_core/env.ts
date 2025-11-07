import fs from "fs";
import path from "path";

const clean = (value?: string | null): string =>
  String(value ?? "").replace(/^['"\s]+|['"\s]+$/g, "").trim();

const readFileValue = (maybePath?: string): string => {
  const p = clean(maybePath);
  if (!p) return "";
  try {
    const resolved = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved, "utf8").trim();
    }
  } catch {}
  return "";
};

const readEnvFileKey = (): string => {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return "";
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = clean(line.slice(0, idx));
      const value = line.slice(idx + 1);
      if (key === "OPENAI_API_KEY") return value;
      if (key === "OPENAI_API_KEY_SECRET") return value;
    }
  } catch {}
  return "";
};

const loadOpenAIKey = (): string => {
  const candidates = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_SECRET,
    process.env.OPENAI_KEY,
    process.env.OPENAI_API_KEY_REAL,
    process.env.OPENAI_API_KEY_OVERRIDE,
    process.env.OPENAI_SECRET,
    process.env.VITE_OPENAI_API_KEY,
    readEnvFileKey(),
    readFileValue(process.env.OPENAI_API_KEY_FILE),
  ];

  const sanitized = candidates
    .map(clean)
    .filter(Boolean);

  const valid = sanitized.find(v => v.startsWith("sk-"));
  return valid ?? (sanitized[0] ?? "");
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Adzuna
  adzunaAppId: process.env.ADZUNA_APP_ID ?? "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY ?? "",
  adzunaCountry: process.env.ADZUNA_COUNTRY ?? "br",
  adzunaBaseUrl: process.env.ADZUNA_BASE_URL ?? "https://api.adzuna.com/v1/api",
  adzunaResultsPerPage: parseInt(process.env.ADZUNA_RESULTS_PER_PAGE ?? "20"),
  adzunaLanguage: process.env.ADZUNA_LANGUAGE ?? "pt_BR",
  // Udemy affiliate / Ads
  udemyAccountSid: clean(process.env.UDEMY_ACCOUNT_SID),
  udemyAuthToken: clean(process.env.UDEMY_AUTH_TOKEN),
  udemyBaseUrl: process.env.UDEMY_BASE_URL ?? "https://www.udemy.com/api-2.0",
  // DIO & Fundação Bradesco
  dioBaseUrl: process.env.DIO_BASE_URL ?? "https://www.dio.me",
  bradescoBaseUrl: process.env.BRADESCO_BASE_URL ?? "https://www.ev.org.br",
  coursesSyncTerms: (process.env.COURSES_SYNC_TERMS ?? "react,typescript,excel,logistica,front-end")
    .split(/[,;]+/)
    .map((term) => term.trim())
    .filter(Boolean),
  coursesCacheTtlMs: parseInt(process.env.COURSES_CACHE_TTL_MS ?? `${15 * 60 * 1000}`),
  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  geminiMaxTokens: parseInt(process.env.GEMINI_MAX_TOKENS ?? "8192"),
  // OpenAI
  openaiApiKey: loadOpenAIKey(),
  openaiModel: clean(process.env.OPENAI_MODEL) || "gpt-4o-mini",
  openaiMaxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? "4096"),
};
