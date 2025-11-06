import { ENV } from "./env";

type AdzunaJob = {
  id: string | number;
  title: string;
  company?: { display_name?: string } | null;
  description?: string;
  location?: { display_name?: string };
  salary_min?: number | null;
  salary_max?: number | null;
  contract_time?: string | null; // full_time, part_time
  contract_type?: string | null; // permanent, contract
  redirect_url?: string;
};

export type NormalizedJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_min?: number | null;
  salary_max?: number | null;
  modality?: string | null;
  compatibility: number;
  external_url?: string;
};

export async function searchAdzunaJobs(params: {
  query: string;
  resultsPerPage?: number;
  location?: string;
}): Promise<NormalizedJob[]> {
  if (!ENV.adzunaAppId || !ENV.adzunaAppKey) {
    throw new Error("Adzuna API não configurada (ADZUNA_APP_ID/ADZUNA_APP_KEY)");
  }

  const page = 1; // simples: primeira página
  const resultsPerPage = params.resultsPerPage ?? ENV.adzunaResultsPerPage ?? 20;
  const base = ENV.adzunaBaseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/jobs/${ENV.adzunaCountry}/search/${page}`);
  url.searchParams.set("app_id", ENV.adzunaAppId);
  url.searchParams.set("app_key", ENV.adzunaAppKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("what", params.query);
  if (params.location) url.searchParams.set("where", params.location);
  if (ENV.adzunaLanguage) url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Adzuna request failed: ${res.status} ${res.statusText} – ${txt}`);
  }
  const data = await res.json();
  const results: AdzunaJob[] = data?.results ?? [];

  const normalized: NormalizedJob[] = results.map((j) => ({
    id: String(j.id),
    title: j.title,
    company: j.company?.display_name ?? "",
    description: j.description ?? "",
    location: j.location?.display_name ?? "",
    salary_min: j.salary_min ?? null,
    salary_max: j.salary_max ?? null,
    modality: j.contract_time ?? j.contract_type ?? null,
    compatibility: Math.floor(Math.random() * 41) + 60, // 60-100%
    external_url: j.redirect_url,
  }));

  return normalized;
}

