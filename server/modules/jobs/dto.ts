export type JobCompanySummary = {
  id?: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
};

export type JobCardDTO = {
  id: string;
  title: string;
  company: JobCompanySummary;
  location?: string | null;
  remote: boolean;
  salaryLabel?: string | null;
  matchScore: number;
  postedAt?: string | null;
  source: "adzuna" | "web";
};

export type RecommendedJobDTO = JobCardDTO & {
  applyUrl: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
};

export type SimilarJobDTO = {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  applyUrl: string;
};

export type JobDetailDTO = {
  id: string;
  title: string;
  company: JobCompanySummary;
  location?: string | null;
  remote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryLabel?: string | null;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  postedAt?: string | null;
  source: "adzuna" | "web";
  applyUrl: string;
  matchScore?: number;
  similar: SimilarJobDTO[];
};

export type NormalizedJob = {
  title: string;
  company: string;
  location?: string | null;
  remote?: boolean;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryLabel?: string | null;
  applyUrl: string;
  externalId?: string | null;
  postedAt?: string | null;
  source: "adzuna" | "web";
  raw?: unknown;
};

export type SearchAndIngestOptions = {
  userId?: number;
  q?: string;
  location?: string;
  remote?: boolean;
};

export type MatchComputationResult = {
  score: number;
  breakdown: Partial<Record<
    "skills" | "location" | "seniority" | "role" | "extras",
    number
  >>;
};
