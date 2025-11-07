import { CourseDetailData, NormalizedCourse } from "../types";
import {
  cleanText,
  createCourseId,
  dedupeByUrl,
  extractMarkdownSection,
  fetchText,
  normalizePrice,
  sanitizeSkills,
} from "./utils";

const PROVIDER = "Coursera";
const BASE_PROXY = "https://r.jina.ai/https://www.coursera.org";

const COURSE_LINE_REGEX = /\[###\s*([^\]]+)\]\((https:\/\/www\.coursera\.org\/[^\)]+)\)/i;

interface ParsedLine {
  provider?: string;
  title?: string;
  url?: string;
  skills?: string[];
  rating?: number;
  reviews?: string;
  level?: string;
  duration?: string;
}

function parseCourseBlock(rawText: string, fallbackSkill: string): NormalizedCourse | null {
  const match = rawText.match(COURSE_LINE_REGEX);
  if (!match) return null;
  const [_, title, url] = match;
  const lines = rawText.split(/\n+/).map((line) => cleanText(line));
  const info: ParsedLine = { title: cleanText(title), url, skills: [] };

  for (const line of lines) {
    if (line.startsWith("Skills you'll gain:")) {
      const skills = line.replace("Skills you'll gain:", "").split(",").map((item) => item.trim());
      info.skills = info.skills?.concat(skills);
    }
    if (line.includes("Rating")) {
      const ratingMatch = line.match(/([\d.]+)\s+out of 5/);
      if (ratingMatch) info.rating = parseFloat(ratingMatch[1]);
    }
    if (/Beginner|Intermediate|Advanced|Mixed/i.test(line) && line.includes("Course")) {
      info.level = line.split("Course")[0].trim();
    }
    if (line.includes("Weeks") || line.includes("Months")) {
      info.duration = line.replace(/.*Course\s+/, "").trim();
    }
    if (!info.provider && /^(Meta|IBM|Google|Packt|University)/i.test(line)) {
      info.provider = line.split(/\s{2,}/)[0].trim();
    }
  }

  return {
    id: createCourseId(PROVIDER, url),
    title: cleanText(title),
    summary:
      lines.find((line) => line && !line.startsWith("[") && !line.startsWith("Skills")) ||
      `Curso disponível na Coursera focado em ${fallbackSkill}.`,
    url,
    provider: PROVIDER,
    priceLabel: normalizePrice("Gratuito"),
    rating: info.rating,
    skills: sanitizeSkills([fallbackSkill, ...(info.skills ?? []), "React"]),
    workload: undefined,
    estimatedTime: info.duration ? info.duration.replace(/Course\s*/i, "").trim() : undefined,
    certification: true,
    category: info.level ? `Coursera • ${info.level}` : "Tecnologia / Carreira",
  };
}

export async function searchCoursera(query: string): Promise<NormalizedCourse[]> {
  const text = await fetchText(`${BASE_PROXY}/courses?query=${encodeURIComponent(query)}`);
  const markdown = extractMarkdownSection(text);
  const blocks = markdown.split(/\n{2,}/);
  const courses: NormalizedCourse[] = [];
  for (const block of blocks) {
    if (!COURSE_LINE_REGEX.test(block)) continue;
    const course = parseCourseBlock(block, query);
    if (course) courses.push(course);
  }
  return dedupeByUrl(courses).slice(0, 12);
}

export async function getCourseraDetail(course: NormalizedCourse): Promise<CourseDetailData | null> {
  try {
    const text = await fetchText(`${BASE_PROXY}${new URL(course.url).pathname}`);
    const markdown = extractMarkdownSection(text);
    const descriptionLines = markdown
      .split("\n")
      .map((line) => cleanText(line))
      .filter((line) => line && !line.startsWith("[") && !line.startsWith("Skills you'll gain:"))
      .slice(0, 40);

    const similar = markdown
      .split("\n")
      .filter((line) => COURSE_LINE_REGEX.test(line) && !line.includes(course.url))
      .slice(0, 3)
      .map((line) => {
        const match = line.match(COURSE_LINE_REGEX);
        if (!match) return null;
        return {
          title: cleanText(match[1]),
          priceLabel: "Gratuito",
          rating: undefined,
          url: match[2],
        };
      })
      .filter(Boolean) as CourseDetailData["similar"];

    return {
      id: course.id,
      title: course.title,
      summary: course.summary,
      description:
        descriptionLines.join(" ") ||
        `${course.summary} Curso oferecido pela Coursera para profissionais interessados em ${course.skills.join(", ")}.`,
      url: course.url,
      imageUrl: course.imageUrl,
      provider: course.provider,
      rating: course.rating,
      priceLabel: course.priceLabel,
      skills: course.skills,
      workload: course.workload,
      estimatedTime: course.estimatedTime,
      certification: course.certification,
      similar,
    };
  } catch (error) {
    console.warn("[Courses][Coursera] Failed to load detail:", error);
    return null;
  }
}
