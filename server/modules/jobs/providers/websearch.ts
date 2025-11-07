import type { NormalizedJob } from "../dto";
import { invokeLLM } from "../../../_core/llm";

const FALLBACK_LIMIT = 5;

const buildPrompt = (q: string, location?: string, limit?: number) => {
  const constraints = [
    "Procure na web vagas reais em sites confiáveis (LinkedIn, Gupy, Kenoby, Workable, Greenhouse, etc.).",
    "Extraia apenas vagas com link direto de candidatura (apply URL).",
    "Traga o nome da empresa e o título completo da vaga.",
    "Se houver faixa salarial explícita, capture.",
    "Retorne os dados em JSON seguindo o formato especificado.",
  ];

  const targetLocation = location ? ` na região de ${location}` : "";

  return `Quero uma lista com até ${limit ?? FALLBACK_LIMIT} vagas atuais${targetLocation} para "${q}".
${constraints
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n")}

Formato JSON:
[
  {
    "title": "...",
    "company": "...",
    "location": "...",
    "applyUrl": "https://...",
    "salary": "...",
    "description": "Resumo curto (máx. 280 caracteres)"
  }
]

Apenas JSON válido.`; // O LLM atual não possui browsing nativo, portanto tratamos a resposta como hints.
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
};

const sanitizeUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

export async function searchWeb(params: {
  q: string;
  location?: string;
  limit?: number;
}): Promise<NormalizedJob[]> {
  if (!params.q?.trim()) return [];

  try {
    const prompt = buildPrompt(params.q, params.location, params.limit);
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é uma agente que transforma resultados reais de vagas em dados estruturados. Se não conseguir confirmar um link de candidatura válido, não retorne a vaga.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = String(result?.choices?.[0]?.message?.content ?? "").trim();
    const parsed = safeParse(raw);

    const normalized: NormalizedJob[] = [];
    for (const entry of parsed) {
      const applyUrl = sanitizeUrl((entry as any)?.applyUrl ?? (entry as any)?.url);
      const title = String((entry as any)?.title ?? (entry as any)?.nome ?? "").trim();
      if (!applyUrl || !title) continue;

      normalized.push({
        title,
        company:
          String((entry as any)?.company ?? (entry as any)?.empresa ?? "").trim() ||
          "Empresa não informada",
        location: (entry as any)?.location ? String((entry as any)?.location).trim() : null,
        description: (entry as any)?.description
          ? String((entry as any)?.description).trim()
          : null,
        salaryLabel: (entry as any)?.salary ? String((entry as any)?.salary).trim() : null,
        applyUrl,
        source: "web",
        raw: entry,
      });
    }

    return normalized;
  } catch (error) {
    console.warn("[Jobs][WebSearch] Failed to obtain hints from LLM:", error);
    return [];
  }
}
