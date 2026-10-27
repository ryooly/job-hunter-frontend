export type EducationLevel = "any" | "smp" | "sma_smk";

export interface District {
  code: string;
  name: string;
  city: string;
}

export interface Company {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobVacancy {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  skills: string | null;
  // Optional street-level address; district_code remains the required area.
  street_address: string | null;
  min_education_level: EducationLevel;
  min_experience_years: number;
  application_deadline: string | null;
  duration_days: number;
  is_active: boolean;
  company_id: number;
  district_code: string;
  created_at: string;
  updated_at: string;
  company: Company | null;
  district: District | null;
  // Computed by backend
  days_remaining: number | null;
  expiry_progress: number | null;
  is_expired: boolean;
  skills_list: string[];
}
