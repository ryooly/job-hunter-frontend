import type { EducationLevel, JobVacancy } from "../types";
import { educationLabel } from "../utils/format";

export interface Category {
  id: string;
  label: string;
  /** Server-side keyword filter applied when this option is active. */
  keyword?: string;
  /** Client-side filter over already-loaded vacancies. */
  predicate?: (vacancy: JobVacancy) => boolean;
}

/** A dropdown chip: a labelled group of mutually-exclusive filter options. */
export interface FilterGroup {
  id: string;
  label: string;
  options: Category[];
}

/** Unfiltered default — never rendered as a chip, used for reset/state. */
export const DEFAULT_CATEGORY: Category = {
  id: "all",
  label: "Semua Pekerjaan",
};

/** School levels offered in the Minimum Education filter, in bar order. */
const EDU_ORDER: Record<EducationLevel, true> = {
  any: true,
  smp: true,
  sma_smk: true,
};

/** Jobs requiring 2 or more years of experience count as experienced;
 * anything below that (0–1 years) is still entry level. */
export function isExperienced(years: number): boolean {
  return years >= 2;
}

// Backend fields are limited, so each option maps to a server keyword (matched
// against the vacancy title) and/or a client-side predicate.
export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "bidang",
    label: "Bidang",
    options: [
      { id: "backend", label: "Backend", keyword: "backend" },
      { id: "design", label: "Desain", keyword: "desain" },
      { id: "admin", label: "Admin", keyword: "admin" },
      { id: "health", label: "Kesehatan", keyword: "perawat" },
      { id: "office", label: "Umum & Fasilitas", keyword: "office" },
    ],
  },
  {
    id: "lokasi",
    label: "Tempat kerja",
    options: [
      {
        id: "jakarta",
        label: "Jakarta Pusat",
        predicate: (v) => v.district?.city?.includes("Jakarta") ?? false,
      },
    ],
  },
  {
    id: "gaji",
    label: "Gaji",
    options: [
      {
        id: "gaji:unannounced",
        label: "Tidak Diumumkan",
        // No vacancy discloses a salary yet; grow this group into bands
        // once salary is modeled on the backend.
        predicate: () => true,
      },
    ],
  },
  {
    id: "pendidikan",
    label: "Pendidikan Minimum",
    // One option per school level the backend models; pressing a card tag
    // or detail chip reuses these same ids.
    options: (Object.keys(EDU_ORDER) as EducationLevel[]).map((level) => ({
      id: `edu:${level}`,
      label: educationLabel(level),
      predicate: (v) => v.min_education_level === level,
    })),
  },
  {
    id: "jenis",
    label: "Jenis",
    options: [
      {
        id: "entry",
        label: "Entry Level",
        predicate: (v) => !isExperienced(v.min_experience_years),
      },
      {
        id: "experienced",
        label: "Berpengalaman",
        predicate: (v) => isExperienced(v.min_experience_years),
      },
    ],
  },
  {
    id: "diposting",
    label: "Diposting",
    options: [
      {
        id: "today",
        label: "Hari ini",
        predicate: (v) => isRecent(v.created_at, 1),
      },
      {
        id: "week",
        label: "Minggu ini",
        predicate: (v) => isRecent(v.created_at, 7),
      },
    ],
  },
];

const ALL_OPTIONS: Category[] = [
  DEFAULT_CATEGORY,
  ...FILTER_GROUPS.flatMap((g) => g.options),
];

export function findCategory(id: string): Category {
  return ALL_OPTIONS.find((c) => c.id === id) ?? DEFAULT_CATEGORY;
}

/**
 * Resolve any category id — static option or dynamic one produced by a
 * job-card filter chip (`dist:<name>`, `exp:<years>`) — into a Category
 * the filter bar and the vacancy hook can work with.
 */
export function resolveCategory(id: string): Category {
  if (id.startsWith("dist:")) {
    const name = decodeURIComponent(id.slice(5));
    return {
      id,
      label: name,
      predicate: (v) => v.district?.name === name,
    };
  }
  if (id.startsWith("exp:")) {
    const years = Number(id.slice(4));
    if (!Number.isNaN(years)) {
      // A pressed chip categorizes its level, not the exact year count:
      // ≥2 years lands in "Berpengalaman", otherwise "Entry Level".
      const experienced = isExperienced(years);
      return {
        id,
        label: experienced ? "Berpengalaman" : "Entry Level",
        predicate: (v) => isExperienced(v.min_experience_years) === experienced,
      };
    }
  }
  return findCategory(id);
}

/** Which filter group (if any) an active category id belongs to. */
export function groupOfCategory(id: string): FilterGroup | undefined {
  // Dynamic chip ids map onto the group they filter.
  if (id.startsWith("dist:")) return FILTER_GROUPS.find((g) => g.id === "lokasi");
  if (id.startsWith("exp:")) return FILTER_GROUPS.find((g) => g.id === "jenis");
  return FILTER_GROUPS.find((g) => g.options.some((o) => o.id === id));
}

function isRecent(dateStr: string, days: number): boolean {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 86_400_000;
}
