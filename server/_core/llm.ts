import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  const raw = (ENV.openaiApiKey || process.env.OPENAI_API_KEY || "").trim();
  const apiKey = raw.replace(/^['"]+|['"]+$/g, "");
  if (apiKey) {
    console.info(`[LLM] Using OpenAI key prefix: ${apiKey.slice(0, 8)}${apiKey.length > 8 ? '***' : ''}`);
  }
  if (!apiKey || !apiKey.startsWith("sk-")) {
    throw new Error(`OPENAI_API_KEY is not configured or invalid (prefix: ${apiKey.slice(0, 8)})`);
  }
  const model = (ENV.openaiModel || process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  const toOAIParts = (content: MessageContent): any => {
    if (typeof content === 'string') return { type: 'text', text: content };
    const anyc: any = content as any;
    if (anyc.type === 'text') return { type: 'text', text: anyc.text };
    if (anyc.type === 'image_url') return { type: 'image_url', image_url: { url: anyc.image_url.url } };
    if (anyc.type === 'file_url') return { type: 'input_text', text: anyc.file_url.url };
    return { type: 'text', text: String(content) };
  };

  const messages = params.messages.map(m => {
    const parts = Array.isArray(m.content) ? (m.content as any[]).map(toOAIParts) : [toOAIParts(m.content as any)];
    if (parts.length === 1 && parts[0].type === 'text') {
      return { role: m.role, content: parts[0].text } as any;
    }
    return { role: m.role, content: parts } as any;
  });

  const payload: any = {
    model,
    messages,
    max_tokens: ENV.openaiMaxTokens ?? 4096,
  };

  if (params.tools && params.tools.length) {
    payload.tools = params.tools;
    if (params.toolChoice || params.tool_choice) payload.tool_choice = params.toolChoice || params.tool_choice;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI invoke failed: ${res.status} ${res.statusText} – ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return {
    id: data?.id || "openai-response",
    created: Math.floor(Date.now()/1000),
    model,
    choices: [ { index: 0, message: { role: 'assistant', content }, finish_reason: null } ],
  };
}

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveForgeApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertForgeApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("FORGE API key is not configured");
  }
};

let DISCOVERED_MODEL: string | null = null;

async function listModels(ver: "v1" | "v1beta"): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(ENV.geminiApiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const arr = Array.isArray(data?.models) ? data.models : [];
  return arr.map((m: any) => String(m?.name || m?.id || ""))
    .filter(Boolean)
    .map((s: string) => s.replace(/^models\//, ""));
}

async function discoverBestModel(): Promise<string | null> {
  try {
    const [m1, m2] = await Promise.all([listModels("v1" as const), listModels("v1beta" as const)]);
    const models = Array.from(new Set([...m1, ...m2]));
    if (models.length === 0) return null;
    // Preferir 2.5, depois 1.5 (flash), evitar legados
    const preferred = [
      /gemini-2\.5-flash$/,
      /gemini-2\.5-pro$/,
      /gemini-1\.5-flash-002$/,
      /gemini-1\.5-flash$/,
    ];
    for (const rx of preferred) {
      const found = models.find(id => rx.test(id));
      if (found) return found;
    }
    return models[0];
  } catch {
    return null;
  }
}

async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const systemParts: string[] = [];
  const contents: any[] = [];

  for (const m of params.messages) {
    const partsArray = ensureArray(m.content)
      .filter((p) => typeof p === "string" || (p as any).type === "text")
      .map((p) => (typeof p === "string" ? { text: p } : { text: (p as any).text }));

    if (partsArray.length === 0) continue;

    if (m.role === "system") {
      systemParts.push(...partsArray.map((p) => p.text));
      continue;
    }

    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: partsArray });
  }

  const body: any = { contents };
  if (systemParts.length > 0) {
    // Para compatibilidade ampla, injeta instruções como primeira mensagem de usuário
    contents.unshift({ role: "user", parts: systemParts.map((t) => ({ text: t })) });
  }
  body.generationConfig = {
    maxOutputTokens: ENV.geminiMaxTokens ?? 8192,
  };

  // Tenta combinações enxutas para reduzir 404 e intermitências
  const normalizeCandidates = (): string[] => {
    const raw = (ENV.geminiModel || "").trim();
    const noLatest = raw.replace(/-latest$/i, "");
    const hasNumeric = /-\d{3,}$/.test(noLatest);
    const list = new Set<string>();
    // Apenas o modelo configurado sem sufixos alternativos
    return [noLatest || "gemini-2.5-flash"];
  };

  // Não usar descoberta automática para estabilidade
  const models = normalizeCandidates();
  const apiVersions = ["v1beta"];
  let lastError: any = null;
  const tried: string[] = [];
  // Cache de combo funcional entre chamadas para reduzir intermitência
  const WORK_VER = (globalThis as any).__GEMINI_VER__ as string | undefined;
  const WORK_MODEL = (globalThis as any).__GEMINI_MODEL__ as string | undefined;
  const orderedVersions = WORK_VER ? [WORK_VER, ...apiVersions.filter(v => v !== WORK_VER)] : apiVersions;
  const orderedModels = WORK_MODEL ? [WORK_MODEL, ...models.filter(m => m !== WORK_MODEL)] : models;

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  for (const ver of orderedVersions) {
    for (const model of orderedModels) {
      const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${model.replace(/-latest$/i, "")}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`;
      try {
        const maxRetries = 2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!res.ok) {
              const txt = await res.text();
              const msg = `Gemini invoke failed: ${res.status} ${res.statusText} – ${txt}`;
              if (res.status === 404) {
                lastError = new Error(msg);
                tried.push(`${ver}/${model}`);
                // 404: modelo/método indisponível neste ver; partir para próximo candidato
                break;
              }
              // 429/5xx: tenta novamente com backoff
              if ([429, 500, 502, 503, 504].includes(res.status) && attempt < maxRetries) {
                await sleep(200 * Math.pow(2, attempt));
                continue;
              }
              // 429: opcionalmente tentar fallback de modelo se permitido por env
              if (res.status === 429 && process.env.GEMINI_ALLOW_FALLBACK_ON_429 === '1') {
                const fallbackModels = ['gemini-1.5-flash'];
                for (const fm of fallbackModels) {
                  const vers = ['v1beta', 'v1'];
                  for (const v2 of vers) {
                    const altEndpoint = `https://generativelanguage.googleapis.com/${v2}/models/${fm}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`;
                    const altRes = await fetch(altEndpoint, {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify(body),
                    });
                    if (altRes.ok) {
                      const data2 = (await altRes.json()) as any;
                      const text2 = data2?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('\n') ?? '';
                      (globalThis as any).__GEMINI_VER__ = v2 as any;
                      (globalThis as any).__GEMINI_MODEL__ = fm;
                      return {
                        id: data2?.requestId ?? 'gemini-response',
                        created: Math.floor(Date.now() / 1000),
                        model: fm,
                        choices: [ { index: 0, message: { role: 'assistant', content: text2 }, finish_reason: null } ],
                      } as InvokeResult;
                    }
                  }
                }
              }
              throw new Error(msg);
            }
            const data = (await res.json()) as any;
            const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n") ?? "";
            // Memoriza combo funcional
            (globalThis as any).__GEMINI_VER__ = ver;
            (globalThis as any).__GEMINI_MODEL__ = model;
            return {
              id: data?.requestId ?? "gemini-response",
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [
                { index: 0, message: { role: "assistant", content: text }, finish_reason: null },
              ],
            } as InvokeResult;
          } catch (fetchErr: any) {
            clearTimeout(timeout);
            lastError = fetchErr;
            // Abort/Network: retry mais uma vez
            if (attempt < maxRetries) {
              await sleep(200 * Math.pow(2, attempt));
              continue;
            }
          }
        }
      } catch (e) {
        lastError = e;
        // tenta próximo candidato
      }
    }
  }
  const hint = tried.length ? ` (tentativas: ${tried.join(", ")})` : "";
  throw new Error(String(lastError?.message || lastError || "Gemini invoke failed") + hint);
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (ENV.openaiApiKey) {
    return await invokeOpenAI(params);
  }
  if (ENV.geminiApiKey) {
    try {
      return await invokeGemini(params);
    } catch (err) {
      if (process.env.GEMINI_STRICT === '1') {
        throw err as any;
      }
      console.warn("[LLM] Gemini model failed (", ENV.geminiModel, "):", String(err));
      try {
        // Fallback para um modelo rápido caso o Pro esteja indisponível
        const prevModel = ENV.geminiModel;
        (ENV as any).geminiModel = "gemini-1.5-flash";
        const res = await invokeGemini(params);
        (ENV as any).geminiModel = prevModel;
        console.info("[LLM] Fallback to gemini-1.5-flash-latest succeeded");
        return res;
      } catch (err2) {
        console.error("[LLM] Gemini fallback also failed:", String(err2));
        throw err2;
      }
    }
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 32768
  payload.thinking = {
    "budget_tokens": 128
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  assertForgeApiKey();
  const response = await fetch(resolveForgeApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}


// OpenAI integration inserted by tool will be compiled with node-fetch global


