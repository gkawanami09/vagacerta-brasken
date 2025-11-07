import { ENV } from "../../../_core/env";
import type { NormalizedJob } from "../dto";

type AdzunaResult = {
  id: string | number;
  title: string;
  company?: { display_name?: string | null } | null;
  location?: { display_name?: string | null } | null;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  redirect_url?: string | null;
  created?: string | null;
  category?: { label?: string | null } | null;
  contract_type?: string | null;
  contract_time?: string | null;
};

const normalizeSalary = (min?: number | null, max?: number | null) => {
  const parsedMin = typeof min === "number" && Number.isFinite(min) ? Math.round(min) : null;
  const parsedMax = typeof max === "number" && Number.isFinite(max) ? Math.round(max) : null;
  return { salaryMin: parsedMin, salaryMax: parsedMax };
};

export async function searchAdzuna(params: {
  q?: string;
  location?: string;
  page?: number;
}): Promise<NormalizedJob[]> {
  if (!ENV.adzunaAppId || !ENV.adzunaAppKey) {
    console.warn("[Jobs][Adzuna] Missing credentials, skipping request");
    return [];
  }

  const baseUrl = (ENV.adzunaBaseUrl || "https://api.adzuna.com/v1/api").replace(/\/$/, "");
  const url = new URL(
    `${baseUrl}/jobs/${ENV.adzunaCountry || "br"}/search/${Math.max(1, params.page ?? 1)}`
  );
  url.searchParams.set("app_id", ENV.adzunaAppId);
  url.searchParams.set("app_key", ENV.adzunaAppKey);
  url.searchParams.set("results_per_page", String(ENV.adzunaResultsPerPage || 20));
  if (params.q) url.searchParams.set("what", params.q);
  if (params.location) url.searchParams.set("where", params.location);
  url.searchParams.set("content-type", "application/json");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Adzuna request failed: ${response.status} ${response.statusText} – ${text}`);
  }

  const payload = await response.json();
  const results: AdzunaResult[] = Array.isArray(payload?.results) ? payload.results : [];

  return results
    .filter((item) => typeof item?.redirect_url === "string" && item.redirect_url.length > 0)
    .map<NormalizedJob>((item) => {
      const salary = normalizeSalary(item.salary_min, item.salary_max);
      const description = item.description ?? "";
      const location = item.location?.display_name?.trim() || null;
      const remote = /remot|home.?office|anywhere/i.test(
        `${description} ${location ?? ""}`
      );

      return {
        title: item.title,
        company: item.company?.display_name?.trim() || "Empresa não informada",
        location,
        description,
        salaryMin: salary.salaryMin ?? undefined,
        salaryMax: salary.salaryMax ?? undefined,
        salaryLabel:
          salary.salaryMin || salary.salaryMax
            ? undefined
            : item.category?.label ?? null,
        remote,
        applyUrl: String(item.redirect_url),
        externalId: String(item.id),
        source: "adzuna",
        postedAt: item.created ?? null,
        raw: item,
      };
    });
}
