import { CourseDetailData, CourseDetailResponse, CourseListItem, NormalizedCourse } from "./types";
import { extractMeaningfulText, normalizePrice, sanitizeSkills } from "./providers/utils";

const toCompactText = (value?: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

const summarizeText = (value?: string | null, maxLength = 140): string => {
  const cleaned = toCompactText(value);
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeCut = lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeCut}...`;
};

export const mapCourseToListItem = (course: NormalizedCourse): CourseListItem => ({
  id: course.id,
  categoria: extractMeaningfulText(course.provider) || "Curso",
  titulo: extractMeaningfulText(course.title) || "Curso",
  descricaoResumo: summarizeText(extractMeaningfulText(course.summary) || course.summary),
  preco: normalizePrice(course.priceLabel),
  avaliacao: course.rating ?? undefined,
  plataforma: extractMeaningfulText(course.provider) || "Curso",
  habilidadesDesenvolvidas: sanitizeSkills(course.skills),
  cargaHoraria: extractMeaningfulText(course.workload),
  duracaoEstimada: extractMeaningfulText(course.estimatedTime),
  certificacao: course.certification,
  imagem: course.imageUrl,
  link: course.url,
});

export const mapDetailToResponse = (detail: CourseDetailData): CourseDetailResponse => ({
  id: detail.id,
  titulo: extractMeaningfulText(detail.title) || "Curso",
  preco: normalizePrice(detail.priceLabel),
  avaliacao: detail.rating ?? undefined,
  plataforma: extractMeaningfulText(detail.provider) || "Curso",
  link: detail.url,
  imagem: detail.imageUrl,
  sobre: extractMeaningfulText(detail.description),
  habilidadesDesenvolvidas: sanitizeSkills(detail.skills),
  cargaHoraria: extractMeaningfulText(detail.workload),
  duracaoEstimada: extractMeaningfulText(detail.estimatedTime),
  certificacao: detail.certification,
  ofertaPor: extractMeaningfulText(detail.offerBy) || extractMeaningfulText(detail.provider) || "Curso",
  similares: detail.similar.map((item) => ({
    titulo: extractMeaningfulText(item.title) || "Curso relacionado",
    preco: normalizePrice(item.priceLabel),
    avaliacao: item.rating ?? undefined,
    link: item.url,
  })),
});
