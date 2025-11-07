import { NormalizedCourse, CourseDetailData } from "../types";
import { searchUdemy, getUdemyDetail } from "./udemy";
import { searchCoursera, getCourseraDetail } from "./coursera";
import { searchAlura, getAluraDetail } from "./alura";

export type ProviderKey = "udemy" | "coursera" | "alura";

type ProviderSearch = (query: string) => Promise<NormalizedCourse[]>;
type ProviderDetail = (course: NormalizedCourse) => Promise<CourseDetailData | null>;

const SEARCH_PROVIDERS: Record<ProviderKey, ProviderSearch> = {
  udemy: searchUdemy,
  coursera: searchCoursera,
  alura: searchAlura,
};

const DETAIL_PROVIDERS: Record<ProviderKey, ProviderDetail> = {
  udemy: getUdemyDetail,
  coursera: getCourseraDetail,
  alura: getAluraDetail,
};

export async function searchProviders(
  query: string,
  opts: { providers?: ProviderKey[]; limit?: number } = {}
): Promise<NormalizedCourse[]> {
  const providers = opts.providers ?? (Object.keys(SEARCH_PROVIDERS) as ProviderKey[]);
  const limit = opts.limit ?? 30;
  const promises = providers.map(async (provider) => {
    try {
      return await SEARCH_PROVIDERS[provider](query);
    } catch (error) {
      console.warn(`[Courses][Providers] ${provider} failed:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const flattened = results.flat();
  const seen = new Set<string>();
  const ordered: NormalizedCourse[] = [];
  for (const course of flattened) {
    if (seen.has(course.id)) continue;
    ordered.push(course);
    seen.add(course.id);
    if (ordered.length >= limit) break;
  }
  return ordered;
}

export async function getProviderDetail(course: NormalizedCourse): Promise<CourseDetailData | null> {
  const providerKey = course.provider.toLowerCase() as ProviderKey;
  const handler = DETAIL_PROVIDERS[providerKey];
  if (!handler) return null;
  return handler(course);
}
