import type { NormalizedJob } from "../dto";
import { searchAdzuna } from "./adzuna";
import { searchWeb } from "./websearch";

const dedupeKey = (job: NormalizedJob) => {
  const source = job.source ?? "unknown";
  const external = job.externalId ? `${source}:${job.externalId}` : null;
  if (external) return external.toLowerCase();
  return `${source}:${job.applyUrl.toLowerCase()}`;
};

export async function fetchFromProviders(params: {
  q?: string;
  location?: string;
  includeWeb?: boolean;
}): Promise<NormalizedJob[]> {
  const queries: Array<Promise<NormalizedJob[]>> = [
    searchAdzuna({ q: params.q, location: params.location }),
  ];

  if (params.includeWeb && params.q) {
    queries.push(
      searchWeb({ q: params.q, location: params.location, limit: 5 }).catch((error) => {
        console.warn("[Jobs][Providers] Web search failed:", error);
        return [];
      })
    );
  }

  const results = await Promise.allSettled(queries);
  const merged: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.warn("[Jobs][Providers] Provider failed:", result.reason);
      continue;
    }

    for (const job of result.value) {
      const key = dedupeKey(job);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(job);
    }
  }

  return merged;
}
