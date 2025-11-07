import { NormalizedCourse, CourseDetailData } from "../types";
import {
  createCourseId,
  cleanText,
  dedupeByUrl,
  extractMarkdownSection,
  fetchText,
  normalizePrice,
  parseHours,
  sanitizeSkills,
} from "./utils";

const PROVIDER = "Udemy";
const BASE_PROXY = "https://r.jina.ai/https://www.udemy.com";

type PartialCourse = Partial<NormalizedCourse> & {
  title: string;
  url: string;
  summary?: string;
  priceLabel?: string;
};

const COURSE_LINK_REGEX = /^\[([^\]]+)\]\((https:\/\/www\.udemy\.com\/course\/[^)]+)\)/i;

function finalizeCourse(raw: PartialCourse, fallbackSkill: string): NormalizedCourse | null {
  if (!raw.title || !raw.url) return null;
  const summary = cleanText(raw.summary ?? "");
  return {
    id: createCourseId(PROVIDER, raw.url),
    title: cleanText(raw.title),
    summary: summary || "Curso disponível na Udemy.",
    url: raw.url,
    imageUrl: raw.imageUrl,
    provider: PROVIDER,
    category: raw.category ?? "Tecnologia / Front-end",
    priceLabel: normalizePrice(raw.priceLabel ?? ""),
    rating: raw.rating ?? undefined,
    skills: sanitizeSkills(raw.skills ?? [fallbackSkill, "React", "JavaScript"]),
    workload: raw.workload,
    estimatedTime: raw.estimatedTime,
    certification: raw.certification ?? true,
  };
}

export async function searchUdemy(query: string): Promise<NormalizedCourse[]> {
  const url = `${BASE_PROXY}/courses/search/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url);
  const markdown = extractMarkdownSection(html);
  const lines = markdown.split("\n").map((line) => cleanText(line.replace(/^>+\s*/, "")));
  const results: NormalizedCourse[] = [];
  let current: PartialCourse | null = null;

  for (const line of lines) {
    if (!line) continue;
    const courseMatch = line.match(COURSE_LINK_REGEX);
    if (courseMatch) {
      if (current) {
        const finalized = finalizeCourse(current, query);
        if (finalized) results.push(finalized);
      }
      current = {
        title: courseMatch[1],
        url: courseMatch[2],
        provider: PROVIDER,
        skills: [query],
      };
      continue;
    }

    if (!current) continue;

    if (!current.summary && !line.startsWith("[")) {
      if (!line.startsWith("Rating:") && !line.startsWith("Current price") && !line.startsWith("Add to cart")) {
        if (!line.startsWith("*") && !line.startsWith("!")) {
          current.summary = cleanText(line);
          continue;
        }
      }
    }

    if (line.startsWith("*")) {
      if (line.includes("total hours")) {
        current.workload = parseHours(line);
      }
      if (/Beginner|All Levels|Intermediate|Expert/i.test(line)) {
        current.category = "Tecnologia / Programação";
      }
      continue;
    }

    if (line.startsWith("Rating:")) {
      const ratingMatch = line.match(/Rating:\s*([\d.,]+)/i);
      if (ratingMatch) current.rating = parseFloat(ratingMatch[1].replace(",", "."));
      continue;
    }

    if (line.startsWith("Current price")) {
      current.priceLabel = line.replace("Current price", "").trim();
      continue;
    }

    if (line.startsWith("![Image")) {
      const imageMatch = line.match(/\((https:\/\/img-c\.udemycdn\.com\/course\/[^)]+)\)/i);
      if (imageMatch) current.imageUrl = imageMatch[1];
      continue;
    }
  }

  if (current) {
    const finalized = finalizeCourse(current, query);
    if (finalized) results.push(finalized);
  }

  return dedupeByUrl(results).slice(0, 12);
}

export async function getUdemyDetail(course: NormalizedCourse): Promise<CourseDetailData | null> {
  const slugMatch = course.url.match(/udemy\.com\/course\/([^/]+)\//);
  if (!slugMatch) return null;
  const slug = slugMatch[1];
  try {
    const html = await fetchText(`${BASE_PROXY}/course/${slug}/`);
    const section = extractMarkdownSection(html);
    const lines = section.split("\n").map((line) => cleanText(line.replace(/^>+\s*/, "")));
    const descriptionLines: string[] = [];
    const skills = new Set(course.skills);

    let capture = false;
    for (const line of lines) {
      if (!line) continue;
      if (/What you'll learn/i.test(line)) {
        capture = true;
        continue;
      }
      if (capture) {
        if (line.startsWith("[")) break;
        if (line.startsWith("*")) {
          const skill = cleanText(line.replace(/^[*•-]\s*/, ""));
          if (skill) skills.add(skill);
        } else {
          descriptionLines.push(line);
        }
      }
    }

    const similarCourses = lines
      .filter((line) => line.startsWith("[") && line.includes("udemy.com/course/") && !line.includes(slug))
      .slice(0, 3)
      .map((line) => {
        const match = line.match(COURSE_LINK_REGEX);
        if (!match) return null;
        return {
          title: cleanText(match[1]),
          priceLabel: course.priceLabel,
          rating: course.rating,
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
        `${course.summary} Este curso é oferecido pela Udemy e cobre tópicos práticos de ${skills.values().next().value}.`,
      url: course.url,
      imageUrl: course.imageUrl,
      provider: course.provider,
      rating: course.rating,
      priceLabel: course.priceLabel,
      skills: sanitizeSkills(Array.from(skills)),
      workload: course.workload,
      estimatedTime: course.estimatedTime,
      certification: course.certification,
      similar: similarCourses,
    };
  } catch (error) {
    console.warn("[Courses][Udemy] Failed to fetch detail:", error);
    return null;
  }
}
