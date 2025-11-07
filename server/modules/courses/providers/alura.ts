import { CourseDetailData, NormalizedCourse } from "../types";
import {
  cleanText,
  createCourseId,
  dedupeByUrl,
  fetchText,
  normalizePrice,
  sanitizeSkills,
} from "./utils";

const PROVIDER = "Alura";

type AluraCourse = {
  nome: string;
  slug: string;
  tempo_estimado?: number;
  duracao?: number;
  categoria?: string;
};

async function fetchAluraJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });
  if (!response.ok) throw new Error(`Alura request failed with status ${response.status}`);
  const text = await response.text();
  return JSON.parse(text) as T;
}

export async function searchAlura(query: string): Promise<NormalizedCourse[]> {
  try {
    const list = await fetchAluraJson<AluraCourse[]>(
      `https://www.alura.com.br/api/cursos?busca=${encodeURIComponent(query)}`
    );

    const filtered = list.filter((item) => {
      const name = cleanText(item.nome);
      return (
        name &&
        !/\[em breve]/i.test(name) &&
        (name.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes("react"))
      );
    });

    const courses: NormalizedCourse[] = filtered.slice(0, 12).map((item) => {
      const courseUrl = `https://www.alura.com.br/curso-online-${item.slug}`;
      const workloadHours =
        typeof item.tempo_estimado === "number"
          ? `${item.tempo_estimado} horas`
          : typeof item.duracao === "number"
          ? `${item.duracao} horas`
          : undefined;

      return {
        id: createCourseId(PROVIDER, courseUrl),
        title: cleanText(item.nome),
        summary: `Curso da Alura focado em ${query}. Acesse para conferir o conteúdo completo.`,
        url: courseUrl,
        provider: PROVIDER,
        priceLabel: normalizePrice("Assinatura"),
        rating: undefined,
        skills: sanitizeSkills([query, "Desenvolvimento", "Tecnologia"]),
        workload: workloadHours,
        estimatedTime: workloadHours,
        certification: true,
        category: item.categoria ? `Alura • ${cleanText(item.categoria)}` : "Tecnologia / Alura",
      };
    });

    return dedupeByUrl(courses);
  } catch (error) {
    console.warn("[Courses][Alura] Failed to fetch catalog:", error);
    return [];
  }
}

export async function getAluraDetail(course: NormalizedCourse): Promise<CourseDetailData | null> {
  try {
    const html = await fetchText(`https://r.jina.ai/${course.url}`);
    const markdown = html.split("Markdown Content:").pop() ?? html;
    const lines = markdown.split("\n").map((line) => cleanText(line));

    const description = lines
      .filter((line) => line.length > 0 && !line.startsWith("[") && !line.includes("Assine a Alura"))
      .slice(0, 40)
      .join(" ");

    return {
      id: course.id,
      title: course.title,
      summary: course.summary,
      description: description || `${course.summary} Conteúdo completo disponível na plataforma Alura.`,
      url: course.url,
      imageUrl: course.imageUrl,
      provider: course.provider,
      rating: course.rating,
      priceLabel: course.priceLabel,
      skills: course.skills,
      workload: course.workload,
      estimatedTime: course.estimatedTime,
      certification: course.certification,
      similar: [],
    };
  } catch (error) {
    console.warn("[Courses][Alura] Failed to retrieve course detail:", error);
    return null;
  }
}
