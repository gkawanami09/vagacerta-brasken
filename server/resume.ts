import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import https from "https";

import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { sanitizeAiText } from "./_core/text";

// DefiniÃƒÂ§ÃƒÂµes de Tipos (mantidas)
type ResumeExperience = {
  empresa?: string;
  cargo?: string;
  periodo?: string;
  responsabilidades?: string[];
  resultados?: string[];
};

export type ResumeData = {
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  localizacao?: string | null;
  objetivo?: string | null;
  resumo?: string | null;
  habilidades?: string[];
  formacao?: string[];
  experiencias?: ResumeExperience[];
};

type EnhancedExperience = {
  titulo: string;
  empresa: string;
  periodo: string;
  bullets: string[];
};

type EnhancedEducation = {
  instituicao: string;
  curso: string;
  periodo: string;
};

type EnhancedResume = {
  headline: string;
  summary: string;
  technicalSkills: string[];
  softSkills: string[];
  experiences: EnhancedExperience[];
  education: EnhancedEducation[];
  certifications: string[];
  languages: string[];
  achievements: string[];
};

// Constantes (mantidas)
const SOFT_KEYWORDS = [
  "lider",
  "lideranca",
  "comunic",
  "colabor",
  "trabalho em equipe",
  "empatia",
  "resil",
  "organiz",
  "criativ",
  "adapt",
  "negoci",
  "proativo",
  "proatividade",
  "relacionamento",
  "gestao",
  "planejamento",
  "resolucao de problemas",
  "analitic",
  "aprendiz",
  "autonom",
  "empatia",
  "inteligencia emocional",
];

// FunÃƒÂ§ÃƒÂµes Auxiliares (mantidas)
const sanitize = (value: string | null | undefined): string =>
  sanitizeAiText(String(value ?? ""));

const hasContent = (value: unknown): boolean => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
};

async function extractFromChat(userId: number): Promise<ResumeData | null> {
  try {
    const messages = await db.getChatMessages(userId, 40);
    const transcript = messages
      .map((msg) => `${msg.sender === "user" ? "Usuario" : "MAIA"}: ${msg.content}`)
      .join("\n");

    const prompt =
      "A seguir esta um dialogo entre uma candidata e uma assistente de IA. Extraia um JSON valido (UTF-8) com os campos: nome, email, telefone, localizacao, objetivo, resumo, habilidades (array de strings), formacao (array de strings) e experiencias (array de objetos com empresa, cargo, periodo, responsabilidades [array], resultados [array]). Responda apenas com JSON puro, sem comentarios.\n\nDialogo:\n" +
      transcript;

    const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
    const text = String(response.choices?.[0]?.message?.content ?? "").trim();
    const json = text.replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
    return JSON.parse(json) as ResumeData;
  } catch (error) {
    console.warn("[Resume] Falha ao extrair dados do chat:", error);
    return null;
  }
}

async function enrichResume(data: ResumeData): Promise<EnhancedResume | null> {
  try {
    const payload = JSON.stringify(data, null, 2);
    const prompt = `Voce eh uma especialista em curriculos premium. Reescreva os dados abaixo em um JSON no formato:
{
  "headline": "frase curta destacando cargo/forca",
  "summary": "paragrafo com 3-4 frases fortes, focadas em impacto e motivacao",
  "technicalSkills": ["skill tecnica"],
  "softSkills": ["competencia comportamental"],
  "experiences": [
    {
      "titulo": "Cargo Ã¢â‚¬â€ Empresa",
      "empresa": "Empresa",
      "periodo": "Periodo formatado",
      "bullets": ["Resultado ou impacto mensuravel", "... (3 a 5 itens)"]
    }
  ],
  "education": [
    {
      "instituicao": "Nome",
      "curso": "Curso ou certificacao",
      "periodo": "Periodo ou status"
    }
  ],
  "certifications": ["cert"],
  "languages": ["idioma Ã¢â‚¬â€ nivel"],
  "achievements": ["destaque ou projeto relevante"]
}


Regras:
- Use portugues brasileiro.
- Utilize voz ativa e verbos fortes.
- Cite numeros e resultados sempre que houver base; se nao houver, destaque impacto qualitativo sem inventar dados irreais.
- Trabalhe com 3 a 5 bullets por experiencia, focando em resultados, tecnologias e contexto.
- Nao repita conteudo entre secoes.
- Sempre retorne JSON puro, sem texto adicional.

Dados base:
${payload}`;

    const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
    const text = String(response.choices?.[0]?.message?.content ?? "").trim();
    const json = text.replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
    return JSON.parse(json) as EnhancedResume;
  } catch (error) {
    console.warn("[Resume] Falha ao enriquecer dados:", error);
    return null;
  }
}

const splitSkills = (skills: string[] = []): { technical: string[]; soft: string[] } => {
  const technical: string[] = [];
  const soft: string[] = [];
  skills.forEach((raw) => {
    const skill = sanitize(raw);
    if (!skill) return;
    const normalized = skill.toLowerCase();
    const isSoft = SOFT_KEYWORDS.some((keyword) => normalized.includes(keyword));
    if (isSoft) soft.push(skill);
    else technical.push(skill);
  });
  return { technical, soft };
};

const buildFallbackExperience = (exp: ResumeExperience): EnhancedExperience => {
  const empresa = sanitize(exp.empresa || "");
  const cargo = sanitize(exp.cargo || "Experiencia");
  const periodo = sanitize(exp.periodo || "");
  const bullets: string[] = [];

  exp.responsabilidades?.forEach((item) => {
    const text = sanitize(item);
    if (text) bullets.push(`Responsavel por ${text}`);
  });
  exp.resultados?.forEach((item) => {
    const text = sanitize(item);
    if (text) bullets.push(`Resultados alcanÃƒÂ§ados: ${text}`);
  });

  if (bullets.length === 0) {
    bullets.push("Atuou de forma dedicada, contribuindo diretamente para resultados positivos.");
  }

  return {
    titulo: [cargo, empresa].filter(hasContent).join(" Ã¢â‚¬â€ ") || cargo,
    empresa,
    periodo,
    bullets,
  };
};

const buildFallbackResume = (data: ResumeData): EnhancedResume => {
  const { technical, soft } = splitSkills(data.habilidades ?? []);
  return {
    headline: sanitize(
      data.objetivo || data.resumo || "Profissional em busca de novas oportunidades"
    ),
    summary: sanitize(
      data.resumo ||
        "Profissional dedicada, com foco em entregar resultados e evoluir continuamente."
    ),
    technicalSkills: technical,
    softSkills: soft,
    experiences: (data.experiencias ?? []).map(buildFallbackExperience),
    education: (data.formacao ?? []).map((item) => {
      const sanitized = sanitize(item);
      const parts = sanitized.split(" - ").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) {
        return { instituicao: sanitized, curso: "", periodo: "" };
      }
      return {
        curso: parts[0] ?? sanitized,
        instituicao: parts[1] ?? "",
        periodo: parts.slice(2).join(" - ") ?? "",
      };
    }),
    certifications: [],
    languages: [],
    achievements: [],
  };
};

// --- Funcoes de Desenho e Estilo ---

const COLORS = {
  PRIMARY: "#005691",
  SECONDARY: "#333333",
  LIGHT_GRAY: "#9CA3AF",
  BACKGROUND: "#F5F5F5",
  LINE: "#D1D5DB",
};

const drawSectionTitle = (doc: PDFDocument, title: string, fonts: PdfFonts) => {
  doc.moveDown(0.8);
  doc
    .font(fonts.bold)
    .fontSize(FONT_SIZES.SECTION_TITLE)
    .fillColor(COLORS.PRIMARY)
    .text(title.toUpperCase(), {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    });

  doc.moveDown(0.2);
  doc
    .strokeColor(COLORS.LINE)
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.5);
};

const drawBulletList = (doc: PDFDocument, items: string[], fonts: PdfFonts) => {
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const originX = doc.page.margins.left;
  const bulletX = originX + 6;
  const textX = bulletX + 6;
  const textWidth = usableWidth - (textX - originX);

  items
    .map(sanitize)
    .filter(hasContent)
    .forEach((item) => {
      const y = doc.y + 6;
      doc.save();
      doc.fillColor(COLORS.SECONDARY).circle(bulletX, y, 1.5).fill();
      doc.restore();

      doc
        .font(fonts.regular)
        .fontSize(FONT_SIZES.BODY)
        .fillColor(COLORS.SECONDARY)
        .text(item, textX, doc.y, {
          width: textWidth,
          lineGap: 3,
          paragraphGap: 2,
        });
    });
  doc.moveDown(0.3);
};

const drawTwoColumnList = (doc: PDFDocument, left: string[], right: string[], fonts: PdfFonts) => {
  const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 24;
  const columnWidth = availableWidth / 2;
  const startLeft = doc.page.margins.left;
  const startRight = startLeft + columnWidth + 24;
  const maxRows = Math.max(left.length, right.length);
  let cursorY = doc.y;

  for (let i = 0; i < maxRows; i++) {
    const leftItem = left[i] ? sanitize(left[i]) : "";
    const rightItem = right[i] ? sanitize(right[i]) : "";

    if (leftItem) {
      const y = cursorY + 6;
      doc.save();
      doc.fillColor(COLORS.SECONDARY).circle(startLeft + 6, y, 1.5).fill();
      doc.restore();
      doc
        .font(fonts.regular)
        .fontSize(FONT_SIZES.BODY)
        .fillColor(COLORS.SECONDARY)
        .text(leftItem, startLeft + 12, cursorY, {
          width: columnWidth - 12,
          lineGap: 3,
        });
    }
    const leftBottom = doc.y;

    doc.y = cursorY;
    if (rightItem) {
      const y = cursorY + 6;
      doc.save();
      doc.fillColor(COLORS.SECONDARY).circle(startRight + 6, y, 1.5).fill();
      doc.restore();
      doc
        .font(fonts.regular)
        .fontSize(FONT_SIZES.BODY)
        .fillColor(COLORS.SECONDARY)
        .text(rightItem, startRight + 12, cursorY, {
          width: columnWidth - 12,
          lineGap: 3,
        });
    }
    const rightBottom = doc.y;

    cursorY = Math.max(leftBottom, rightBottom) + 4;
  }

  doc.y = cursorY;
  doc.moveDown(0.4);
};

// --- Funcao Principal de Geracao de PDF ---ÃƒÂ§ÃƒÂ£o Principal de GeraÃƒÂ§ÃƒÂ£o de PDF (Modificada para EstÃƒÂ©tica) ---

export async function generateResumePdf(
  userId: number,
  opts?: { job?: { title?: string; company?: string; description?: string; requirements?: string } },
  provided?: ResumeData
) {
  const profile = await db.getUserProfile(userId);
  const user = await db.getUserById(userId);
  const extracted = provided || (await extractFromChat(userId)) || {};

  const enriched = (await enrichResumeStrong(extracted)) || (await enrichResume(extracted));
  const resume = enriched ?? buildFallbackResume(extracted);

  try {
    await ensureUtf8Fonts();
  } catch (error) {
    console.warn("[Resume] Nao foi possivel preparar fontes UTF-8:", error);
  }

  const dir = path.resolve(process.cwd(), "uploads", "resumes", String(userId));
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = ${Date.now()}-curriculo.pdf;
  const filepath = path.join(dir, filename);

  const doc = new PDFDocument({ margin: 54, size: "A4" });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  let fonts: PdfFonts = { ...FALLBACK_FONTS };
  try {
    doc.registerFont(FONT_NAMES.regular, FONT_FILES.regular);
    doc.registerFont(FONT_NAMES.bold, FONT_FILES.bold);
    doc.registerFont(FONT_NAMES.italic, FONT_FILES.italic);
    fonts = {
      regular: FONT_NAMES.regular,
      bold: FONT_NAMES.bold,
      italic: FONT_NAMES.italic,
    };
  } catch (error) {
    console.warn("[Resume] Usando fontes padrao (Helvetica):", error);
  }

  const nome = sanitize(extracted.nome ?? user?.name ?? "Candidata");
  const email = sanitize(extracted.email ?? user?.email ?? "");
  const phone = sanitize(extracted.telefone ?? profile?.phone ?? "");
  const location = sanitize(extracted.localizacao ?? profile?.location ?? "");

  const headerHeight = 110;
  doc.rect(0, 0, doc.page.width, headerHeight).fill(COLORS.PRIMARY);

  doc
    .fillColor("#FFFFFF")
    .font(fonts.bold)
    .fontSize(FONT_SIZES.NAME)
    .text(nome, doc.page.margins.left, 26, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    });

  if (hasContent(resume.headline)) {
    doc
      .font(fonts.regular)
      .fontSize(FONT_SIZES.HEADLINE)
      .fillColor("#FFFFFF")
      .text(resume.headline, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
  }

  const contactParts = [email, phone, location].filter(hasContent);
  if (contactParts.length) {
    doc
      .font(fonts.regular)
      .fontSize(FONT_SIZES.CONTACT)
      .fillColor("#E5E7EB")
      .text(contactParts.join("  |  "), doc.page.margins.left, doc.y + 6);
  }

  doc.y = headerHeight + 28;
  doc.fillColor(COLORS.SECONDARY);

  if (hasContent(resume.summary)) {
    drawSectionTitle(doc, "Resumo Profissional", fonts);
    doc
      .font(fonts.regular)
      .fontSize(FONT_SIZES.BODY)
      .fillColor(COLORS.SECONDARY)
      .text(resume.summary, {
        lineGap: 4,
        align: "justify",
      });
  }

  if (resume.experiences.length) {
    drawSectionTitle(doc, "Experiência Profissional", fonts);
    resume.experiences.slice(0, 6).forEach((exp) => {
      const title = sanitize(exp.titulo);
      const period = sanitize(exp.periodo);
      const startY = doc.y;

      doc
        .font(fonts.bold)
        .fontSize(FONT_SIZES.SUB_TITLE)
        .fillColor(COLORS.SECONDARY)
        .text(title, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 120,
        });
      const afterTitleY = doc.y;

      if (period) {
        const periodWidth = doc
          .font(fonts.regular)
          .fontSize(FONT_SIZES.CONTACT)
          .widthOfString(period);
        const periodX = doc.page.width - doc.page.margins.right - periodWidth;

        doc
          .font(fonts.regular)
          .fontSize(FONT_SIZES.CONTACT)
          .fillColor(COLORS.LIGHT_GRAY)
          .text(period, periodX, startY);
      }

      doc.y = afterTitleY;
      doc.moveDown(0.1);
      drawBulletList(doc, (exp.bullets ?? []).slice(0, 5), fonts);
      doc.moveDown(0.2);
    });
  }

  if (resume.technicalSkills.length || resume.softSkills.length) {
    drawSectionTitle(doc, "Habilidades e Competências", fonts);
    const tech = resume.technicalSkills.slice(0, 12);
    const soft = resume.softSkills.slice(0, 12);

    if (tech.length && soft.length) {
      const startY = doc.y;
      const columnWidth =
        (doc.page.width - doc.page.margins.left - doc.page.margins.right - 24) / 2;
      const startLeft = doc.page.margins.left;
      const startRight = startLeft + columnWidth + 24;

      doc
        .font(fonts.bold)
        .fontSize(FONT_SIZES.SUB_TITLE)
        .fillColor(COLORS.SECONDARY)
        .text("Técnicas", startLeft, startY, { width: columnWidth });
      doc.y = startY;
      doc
        .font(fonts.bold)
        .fontSize(FONT_SIZES.SUB_TITLE)
        .fillColor(COLORS.SECONDARY)
        .text("Comportamentais (Soft Skills)", startRight, startY, { width: columnWidth });

      doc.moveDown(0.2);
      const maxRows = Math.max(tech.length, soft.length);
      const left = tech.concat(Array(Math.max(0, maxRows - tech.length)).fill(""));
      const right = soft.concat(Array(Math.max(0, maxRows - soft.length)).fill(""));
      drawTwoColumnList(doc, left, right, fonts);
    } else {
      const combined = tech.length ? tech : soft;
      drawBulletList(doc, combined, fonts);
    }
  }

  if (resume.achievements.length) {
    drawSectionTitle(doc, "Principais Conquistas", fonts);
    drawBulletList(doc, resume.achievements.slice(0, 6), fonts);
  }

  if (resume.education.length || resume.certifications.length) {
    drawSectionTitle(doc, "Formação Acadêmica e Certificações", fonts);

    resume.education.slice(0, 6).forEach((edu) => {
      const course = sanitize(edu.curso);
      const institution = sanitize(edu.instituicao);
      const period = sanitize(edu.periodo);
      const header = [course, institution].filter(hasContent).join(" • ") || course || institution;

      doc
        .font(fonts.bold)
        .fontSize(FONT_SIZES.SUB_TITLE)
        .fillColor(COLORS.SECONDARY)
        .text(header);

      if (period) {
        doc
          .font(fonts.italic)
          .fontSize(FONT_SIZES.CONTACT)
          .fillColor(COLORS.LIGHT_GRAY)
          .text(period);
      }

      doc.moveDown(0.2);
    });

    if (resume.certifications.length) {
      doc.moveDown(0.2);
      doc
        .font(fonts.bold)
        .fontSize(FONT_SIZES.SUB_TITLE)
        .fillColor(COLORS.SECONDARY)
        .text("Certificações");
      drawBulletList(doc, resume.certifications.slice(0, 6), fonts);
    }
  }

  if (resume.languages.length) {
    drawSectionTitle(doc, "Idiomas", fonts);
    drawBulletList(doc, resume.languages.slice(0, 6), fonts);
  }

  if (opts?.job?.requirements) {
    drawSectionTitle(doc, "Aderência à Vaga", fonts);
    doc
      .font(fonts.italic)
      .fontSize(FONT_SIZES.BODY)
      .fillColor(COLORS.SECONDARY)
      .text(
        Requisitos principais: . Currículo preparado para realçar competências técnicas e comportamentais aderentes.,
        {
          lineGap: 4,
          align: "justify",
        }
      );
  }

  doc.end();

  await new Promise<void>((resolve) => {
    stream.on("finish", resolve);
    stream.on("close", resolve);
  });

  return {
    path: filepath,
    url: /uploads/resumes//,
    filename,
  };
}

// FunÃƒÂ§ÃƒÂµes de ValidaÃƒÂ§ÃƒÂ£o (mantidas)
export function getMissingResumeFields(data: ResumeData): string[] {
  const missing: string[] = [];
  if (!hasContent(data.nome)) missing.push("nome");
  if (!hasContent(data.email)) missing.push("email");
  if (!hasContent(data.telefone)) missing.push("telefone");
  if (!hasContent(data.localizacao)) missing.push("localizacao");
  if (!hasContent(data.resumo) && !hasContent(data.objetivo)) missing.push("resumo ou objetivo");
  if (!hasContent(data.habilidades)) missing.push("habilidades");
  if (!hasContent(data.formacao)) missing.push("formacao");
  if (!hasContent(data.experiencias)) missing.push("experiencias");
  return missing;
}

export async function getResumeCompletionStatus(userId: number) {
  const data = (await extractFromChat(userId)) || {};
  const missing = getMissingResumeFields(data);
  return { complete: missing.length === 0, missing, data };
}
// Versao reforcada para garantir texto detalhado e profissional
async function enrichResumeStrong(data: ResumeData): Promise<EnhancedResume | null> {
  try {
    const payload = JSON.stringify(data, null, 2);
    const prompt = `Voce e especialista em curriculos premium. Reescreva E ESTRUTURE os dados a seguir retornando JSON PURO valido (UTF-8) no formato EXATO:
{
  "headline": "frase curta destacando cargo/forca",
  "summary": "paragrafo com 3-5 frases em voz ativa, cobrindo anos de experiencia, contexto (setor/tamanho), especialidades, tecnologias chave e impacto (melhorias, economia, qualidade)",
  "technicalSkills": ["skill tecnica"],
  "softSkills": ["competencia comportamental"],
  "experiences": [
    {
      "titulo": "Cargo - Empresa",
      "empresa": "Empresa",
      "periodo": "YYYY-YYYY ou 'Atual'",
      "bullets": [
        "Resultado/impacto claro com numeros quando houver base (%, tempo, custo, qualidade), incluindo tecnologias e contexto",
        "Segundo resultado ou responsabilidade chave",
        "Terceiro item (processos, performance, confiabilidade)",
        "Quarto item (colaboracao, lideranÃƒÂ§a, comunicacao)",
        "Quinto item opcional"
      ]
    }
  ],
  "education": [
    { "instituicao": "Nome", "curso": "Curso/Certificacao", "periodo": "Periodo ou status" }
  ],
  "certifications": ["Certificacao"],
  "languages": ["Idioma - nivel"],
  "achievements": ["Projeto ou destaque com efeito/resultado"]
}

Regras:
- Portugues brasileiro; sem jargao vazio; sem invencao de dados, porem você pode detalhar e estruturar mais o que o usuário te falou.
- Separar hard/soft  skills; derivar soft skills do contexto quando possivel.
- 3 a 5 bullets por experiencia; focar em impacto e tecnologias.
- Retorne SOMENTE o JSON (sem comentarios, prefixos ou sufixos).

Dados base:
${payload}`;

    const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
    const text = String(response.choices?.[0]?.message?.content ?? "").trim();
    const json = text.replace(/^[^{\[]+/, "").replace(/[^}\]]+$/, "");
    return JSON.parse(json) as EnhancedResume;
  } catch (error) {
    console.warn("[Resume] Falha ao enriquecer dados (strong):", error);
    return null;
  }
}
