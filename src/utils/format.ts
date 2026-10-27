/** Format + label helpers shared by the job cards. */

import type { EducationLevel } from "../types";

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function educationLabel(level: EducationLevel): string {
  return { any: "Semua Jurusan", smp: "SMP", sma_smk: "SMA/SMK" }[level];
}

export function experienceLabel(years: number): string {
  if (!years) return "Lulusan Baru / Junior";
  return `${years}+ tahun pengalaman`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
