import type {
  Company,
  District,
  EducationLevel,
  JobVacancy,
  VacancyLocation,
} from "./types";

// Same-origin by default: requests like /job-vacancies are forwarded to the
// backend by the Vite dev proxy (see vite.config.ts), so other devices on the
// network work without hardcoding this PC's IP. Override with VITE_API_BASE
// only when the API lives on a different host.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/** Extract a human-readable message from any failed response. */
async function errorFrom(res: Response): Promise<Error> {
  let detail = "";
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail))
      // FastAPI 422: join each issue's field path and message.
      detail = body.detail
        .map((i: { loc?: (string | number)[]; msg?: string }) => {
          const field = i.loc?.slice(1).join(".") ?? "";
          return field ? `${field}: ${i.msg}` : (i.msg ?? "");
        })
        .filter(Boolean)
        .join("\n");
  } catch {
    // Non-JSON body — fall back to the status line.
  }
  return new Error(detail || `API ${res.status}: ${res.statusText}`);
}

async function request<T>(
  path: string,
  params: Record<string, string | number | boolean | null> = {},
): Promise<T> {
  const url = new URL(API_BASE + path, window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw await errorFrom(res);
  }
  return (await res.json()) as T;
}

async function postJson<T, B>(path: string, body: B): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await errorFrom(res);
  }
  return (await res.json()) as T;
}

export interface VacancyQuery {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export function fetchVacancies({
  keyword = "",
  limit = 10,
  offset = 0,
}: VacancyQuery = {}) {
  return request<JobVacancy[]>("/job-vacancies", {
    keyword: keyword.trim() || null,
    limit,
    offset,
  });
}

export function fetchVacancy(id: number) {
  return request<JobVacancy>(`/job-vacancies/${id}`);
}

/**
 * Address-focused rows for the map. Defaults to active jobs only (the
 * backend's is_active default), matching the live listings.
 */
export function fetchVacancyLocations({
  limit = 200,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  return request<VacancyLocation[]>("/job-vacancies/locations", {
    limit,
    offset,
  });
}

export function fetchCompanies() {
  return request<Company[]>("/companies");
}

export function createCompany(payload: CompanyInput) {
  return postJson<Company, CompanyInput>("/companies", payload);
}

export function fetchDistricts(keyword = "", limit = 50) {
  return request<District[]>("/districts", {
    keyword: keyword.trim() || null,
    limit,
  });
}

/** Body accepted by POST /districts — a custom kecamatan entry. */
export interface DistrictInput {
  code: string;
  name: string;
  city: string;
}

export function createDistrict(payload: DistrictInput) {
  return postJson<District, DistrictInput>("/districts", payload);
}

/** Body accepted by POST /companies. Blank optional fields are sent as null. */
export interface CompanyInput {
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  cover_image: string | null;
}

/** Body accepted by POST /job-vacancies. Skills is the raw comma-separated string. */
export interface VacancyInput {
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  skills: string | null;
  street_address: string | null;
  min_education_level: EducationLevel;
  min_experience_years: number;
  application_deadline: string | null;
  duration_days: number;
  company_id: number;
  district_code: string;
}

export function createVacancy(payload: VacancyInput) {
  return postJson<JobVacancy, VacancyInput>("/job-vacancies", payload);
}
