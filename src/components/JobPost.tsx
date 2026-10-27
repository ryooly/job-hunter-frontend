import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { SVGProps } from "react";
import { ArrowLeft, ChevronDown, ImagePlus, Plus, X } from "lucide-react";
import { siInstagram } from "simple-icons";

import {
  createCompany,
  createDistrict,
  createVacancy,
  fetchCompanies,
  fetchDistricts,
  type CompanyInput,
  type VacancyInput,
} from "../api";
import type { Company, District, EducationLevel, JobVacancy } from "../types";
import { educationLabel } from "../utils/format";
import { SkillBadge, SUGGESTED_SKILLS } from "./SkillBadge";

interface JobPostProps {
  /** Leave the page (back to the list). */
  onCancel: () => void;
}

/** Raw form state for the company block — every field is a plain string. */
type CompanyForm = { [K in keyof CompanyInput]: string };

const EMPTY_COMPANY: CompanyForm = {
  name: "",
  description: "",
  website: "",
  logo_url: "",
  instagram_url: "",
  linkedin_url: "",
  cover_image: "",
};

const blankOrNull = (value: string): string | null => value.trim() || null;

/* ---------- Brand icon buttons for the social-media picker ---------- */

type IconProps = SVGProps<SVGSVGElement>;

function makeBrandIcon(icon: { path: string; hex: string }) {
  const color = `#${icon.hex}`;
  return (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
      <path d={icon.path} />
    </svg>
  );
}
const InstagramIcon = makeBrandIcon(siInstagram);

// LinkedIn was removed from Simple Icons (trademark policy), so ship the
// official "in" mark inline — same approach as SkillBadge's custom logos.
function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
] as const;

type SocialKey = (typeof SOCIAL_FIELDS)[number]["key"];
type SocialField = "instagram_url" | "linkedin_url";

/**
 * Drag-and-drop image field. Dropping (or clicking to browse) reads the file
 * as a base64 data URL and stores it in `onChange` — no text entry needed.
 * `variant` sizes the box: square logo vs. wide cover banner.
 */
function DropZone({
  label,
  value,
  onChange,
  variant,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  variant: "logo" | "cover";
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className={`post-drop post-drop-${variant} post-field-wide`}>
      <span className="post-drop-label">{label}</span>
      {value ? (
        <div className="post-drop-filled">
          <img
            src={value}
            alt={label}
            className="post-drop-img"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          <button
            type="button"
            className="post-drop-clear"
            aria-label={`Hapus ${label}`}
            onClick={() => onChange("")}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`post-drop-empty${dragging ? " dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            readFile(e.dataTransfer.files?.[0]);
          }}
        >
          <ImagePlus size={18} aria-hidden="true" />
          <span>Seret &amp; lepas gambar, atau klik untuk memilih file</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="post-drop-input"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  );
}

/** Combobox behavior shared by the company and district pickers: focus the
 * search field on open, close on any click (or Escape) outside bar + panel. */
function useComboBehavior(
  open: boolean,
  comboRef: RefObject<HTMLDivElement | null>,
  searchRef: RefObject<HTMLInputElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node))
        close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // close is an inline setter; re-running when the panel opens suffices.
  }, [open, comboRef]);
}

/**
 * Job-posting form. Covers the whole vacancy plus its company: pick an
 * existing company or enter a brand-new one (logo and cover image included),
 * choose the work district from the server list, and build the required-skills
 * set from suggestions or custom entries. Submitting creates the company first
 * when needed, then the vacancy.
 */
export function JobPost({ onCancel }: JobPostProps) {
  // --- company ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyMode, setCompanyMode] = useState<"existing" | "new">(
    "existing",
  );
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false); // dropdown panel
  const [newCompany, setNewCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  // Which social field is expanded in the new-company form.
  const [activeSocial, setActiveSocial] = useState<SocialKey | null>(null);

  // --- location ---
  const [districtQuery, setDistrictQuery] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [district, setDistrict] = useState<District | null>(null);
  const [districtOpen, setDistrictOpen] = useState(false); // dropdown panel
  // Custom entry for locations the directory doesn't have yet.
  const [districtCustom, setDistrictCustom] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCity, setCustomCity] = useState("");
  // Optional street-level address, shown under the district on the detail page.
  const [streetAddress, setStreetAddress] = useState("");
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [districtSaving, setDistrictSaving] = useState(false);

  // --- vacancy fields ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [education, setEducation] = useState<EducationLevel>("any");
  const [experience, setExperience] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [deadline, setDeadline] = useState(""); // yyyy-mm-dd from the date input

  // --- skills: suggestion picker + free-text custom entries ---
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  // --- submission state ---
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState<JobVacancy | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const skillsInputRef = useRef<HTMLInputElement>(null);
  const companyComboRef = useRef<HTMLDivElement>(null);
  const companySearchRef = useRef<HTMLInputElement>(null);
  const districtComboRef = useRef<HTMLDivElement>(null);
  const districtSearchRef = useRef<HTMLInputElement>(null);

  // Load the company directory once; it backs the "pick existing" list.
  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  useComboBehavior(companyOpen, companyComboRef, companySearchRef, () =>
    setCompanyOpen(false),
  );
  useComboBehavior(districtOpen, districtComboRef, districtSearchRef, () => {
    setDistrictOpen(false);
    setDistrictCustom(false);
    setDistrictError(null);
  });

  // District search: refetch (debounced) whenever the query text changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDistricts(districtQuery)
        .then(setDistricts)
        .catch(() => setDistricts([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [districtQuery]);

  // Save a custom kecamatan through POST /districts (idempotent on code),
  // then select it like any picked option.
  const handleCreateDistrict = async () => {
    if (!/^\d{7}$/.test(customCode)) {
      setDistrictError("Kode kecamatan harus tepat 7 digit angka.");
      return;
    }
    if (!customName.trim() || !customCity.trim()) {
      setDistrictError("Nama kecamatan dan kota wajib diisi.");
      return;
    }
    setDistrictSaving(true);
    try {
      const created = await createDistrict({
        code: customCode,
        name: customName.trim(),
        city: customCity.trim(),
      });
      setDistrict(created);
      setDistricts((prev) =>
        prev.some((d) => d.code === created.code) ? prev : [...prev, created],
      );
      setDistrictOpen(false);
      setDistrictCustom(false);
      setCustomCode("");
      setCustomName("");
      setCustomCity("");
      setDistrictError(null);
    } catch (err) {
      setDistrictError(
        err instanceof Error ? err.message : "Gagal menyimpan kecamatan.",
      );
    } finally {
      setDistrictSaving(false);
    }
  };

  const visibleCompanies = useMemo(() => {
    const term = companyFilter.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(term));
  }, [companies, companyFilter]);

  const selectedCompany = companies.find((c) => c.id === companyId) ?? null;

  // Toggle which social URL input is expanded; clicking the active, empty one
  // collapses it. A filled field stays revealed regardless.
  const toggleSocial = (key: SocialKey) => {
    const field = `${key}_url` as SocialField;
    setActiveSocial((cur) =>
      cur === key && !newCompany[field].trim() ? null : key,
    );
  };

  const resetNewCompany = () => {
    setNewCompany(EMPTY_COMPANY);
    setActiveSocial(null);
  };

  // Unused suggestions, shown as one-click badges under the skills input.
  const remainingSuggestions = useMemo(() => {
    const taken = new Set(skills.map((s) => s.toLowerCase()));
    return SUGGESTED_SKILLS.filter((s) => !taken.has(s.toLowerCase())).slice(
      0,
      10,
    );
  }, [skills]);

  const addSkill = (raw: string) => {
    const name = raw.trim().replace(/,+$/, "").trim();
    if (!name) return;
    setSkills((prev) =>
      prev.some((s) => s.toLowerCase() === name.toLowerCase())
        ? prev
        : [...prev, name],
    );
    setSkillDraft("");
    skillsInputRef.current?.focus();
  };

  const commitSkillDraft = () => {
    if (skillDraft.trim()) addSkill(skillDraft);
  };

  const validate = (): string[] => {
    const found: string[] = [];
    if (!title.trim()) found.push("Judul pekerjaan wajib diisi.");
    if (!description.trim()) found.push("Deskripsi pekerjaan wajib diisi.");
    if (companyMode === "existing" && companyId === null)
      found.push("Pilih perusahaan dari daftar, atau buat perusahaan baru.");
    if (companyMode === "new" && !newCompany.name.trim())
      found.push("Nama perusahaan wajib diisi.");
    if (!district) found.push("Pilih lokasi kerja (kecamatan).");
    return found;
  };

  const buildPayload = (
    finalCompanyId: number,
    finalSkills: string[],
  ): VacancyInput => ({
    title: title.trim(),
    description: description.trim(),
    requirements: blankOrNull(requirements),
    responsibilities: blankOrNull(responsibilities),
    skills: finalSkills.length ? finalSkills.join(", ") : null,
    street_address: blankOrNull(streetAddress),
    min_education_level: education,
    min_experience_years: experience,
    // An explicit date wins; otherwise the backend derives it from duration.
    application_deadline: deadline ? `${deadline}T23:59:59` : null,
    duration_days: durationDays,
    company_id: finalCompanyId,
    district_code: district?.code ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // A skill typed but not yet committed with Enter still counts — state
    // updates wouldn't be visible in this closure, so fold it in manually.
    const pending = skillDraft.trim().replace(/,+$/, "").trim();
    const finalSkills =
      pending && !skills.some((s) => s.toLowerCase() === pending.toLowerCase())
        ? [...skills, pending]
        : skills;
    if (pending) setSkillDraft("");
    const problems = validate();
    setErrors(problems);
    if (problems.length) return;

    setSubmitting(true);
    try {
      // The company is saved as part of this final submit: create it first
      // when a new one was drafted, then attach the vacancy to its id.
      let finalCompanyId = companyId;
      if (companyMode === "new") {
        const company = await createCompany({
          name: newCompany.name.trim(),
          description: blankOrNull(newCompany.description),
          website: blankOrNull(newCompany.website),
          logo_url: newCompany.logo_url.trim() || null,
          instagram_url: blankOrNull(newCompany.instagram_url),
          linkedin_url: blankOrNull(newCompany.linkedin_url),
          cover_image: newCompany.cover_image.trim() || null,
        });
        finalCompanyId = company.id;
      }
      const vacancy = await createVacancy(
        buildPayload(finalCompanyId!, finalSkills),
      );
      setPosted(vacancy);
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : "Gagal menyimpan lowongan.",
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompanyId(null);
    setCompanyFilter("");
    setCompanyOpen(false);
    setNewCompany(EMPTY_COMPANY);
    setActiveSocial(null);
    setDistrictQuery("");
    setDistrict(null);
    setDistrictOpen(false);
    setDistrictCustom(false);
    setCustomCode("");
    setCustomName("");
    setCustomCity("");
    setStreetAddress("");
    setDistrictError(null);
    setTitle("");
    setDescription("");
    setRequirements("");
    setResponsibilities("");
    setEducation("any");
    setExperience(0);
    setDurationDays(30);
    setDeadline("");
    setSkills([]);
    setSkillDraft("");
    setErrors([]);
    setPosted(null);
    titleRef.current?.focus();
  };

  // Success screen: confirm the post and offer next steps.
  if (posted) {
    return (
      <div className="container post-page">
        <div className="post-card post-success">
          <h2>Lowongan tayang! 🎉</h2>
          <p className="post-success-sub">
            <strong>{posted.title}</strong> berhasil dipasang dan sudah muncul
            di daftar pekerjaan.
          </p>
          <div className="post-success-actions">
            <a className="btn-solid" href={`#job-${posted.id}`}>
              Lihat lowongan
            </a>
            <button type="button" className="btn-outline" onClick={resetForm}>
              Pasang lowongan lain
            </button>
            <button type="button" className="btn-outline" onClick={onCancel}>
              Kembali ke daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container post-page">
      <button type="button" className="post-back" onClick={onCancel}>
        <ArrowLeft size={15} aria-hidden="true" />
        Kembali ke daftar
      </button>

      <h1 className="post-title">Pasang Lowongan Kerja</h1>
      <p className="post-sub">
        Lengkapi detail perusahaan dan pekerjaan — lowongan langsung tayang ke
        pencari kerja.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* ---------------- Company ---------------- */}
        <section className="post-card">
          <h2 className="post-card-title">1. Perusahaan</h2>

          {companyMode === "existing" ? (
            selectedCompany ? (
              <div className="post-picked">
                {selectedCompany.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt=""
                    className="post-picked-logo"
                  />
                ) : (
                  <span className="post-picked-logo post-picked-logo-fallback">
                    {selectedCompany.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div>
                  <strong>{selectedCompany.name}</strong>
                  {selectedCompany.description && (
                    <p className="post-picked-desc">
                      {selectedCompany.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="post-remove"
                  aria-label="Batalkan pilihan perusahaan"
                  onClick={() => setCompanyId(null)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ) : (
              // Single bar that reveals search + options only when clicked.
              <div className="post-combo" ref={companyComboRef}>
                <button
                  type="button"
                  className="post-combo-bar"
                  aria-expanded={companyOpen}
                  aria-haspopup="listbox"
                  onClick={() => setCompanyOpen((open) => !open)}
                >
                  <span>Pilih perusahaan dari daftar…</span>
                  <ChevronDown
                    size={16}
                    className={`post-combo-chevron${companyOpen ? " open" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {companyOpen && (
                  <div className="post-combo-panel">
                    <input
                      ref={companySearchRef}
                      type="search"
                      placeholder="Cari nama perusahaan…"
                      aria-label="Cari perusahaan"
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    />
                    <ul
                      className="post-options"
                      role="listbox"
                      aria-label="Perusahaan tersimpan"
                    >
                      {visibleCompanies.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={c.id === companyId}
                            onClick={() => {
                              setCompanyId(c.id);
                              setCompanyOpen(false);
                            }}
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                      {visibleCompanies.length === 0 && (
                        <li className="post-options-empty">
                          Tidak ada perusahaan yang cocok.
                        </li>
                      )}
                      {/* Creating a company lives in the menu, as the last row. */}
                      <li>
                        <button
                          type="button"
                          className="post-option-new"
                          onClick={() => {
                            setCompanyMode("new");
                            setCompanyOpen(false);
                            setCompanyFilter("");
                          }}
                        >
                          <Plus size={13} aria-hidden="true" />
                          Tambah perusahaan baru
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              <button
                type="button"
                className="post-new-back"
                onClick={() => {
                  setCompanyMode("existing");
                  resetNewCompany();
                }}
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Pilih dari daftar perusahaan
              </button>

              <div className="post-grid">
                <label className="post-field">
                  Nama perusahaan *
                  <input
                    type="text"
                    placeholder="PT Maju Bersama"
                    value={newCompany.name}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, name: e.target.value })
                    }
                  />
                </label>
                <label className="post-field">
                  Website
                  <input
                    type="url"
                    placeholder="https://perusahaan.com"
                    value={newCompany.website ?? ""}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, website: e.target.value })
                    }
                  />
                </label>

                {/* Social media: one connected toggle group; click a brand
                    icon to reveal its URL field. */}
                <div className="post-social post-field-wide">
                  <span className="post-drop-label">Media sosial</span>
                  <div
                    className="post-social-group"
                    role="group"
                    aria-label="Media sosial"
                  >
                    {SOCIAL_FIELDS.map(({ key, label, Icon }) => {
                      const field = `${key}_url` as SocialField;
                      const on =
                        activeSocial === key ||
                        Boolean(newCompany[field].trim());
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`post-social-btn${on ? " active" : ""}`}
                          aria-pressed={on}
                          aria-label={label}
                          title={label}
                          onClick={() => toggleSocial(key)}
                        >
                          <Icon width={18} height={18} />
                        </button>
                      );
                    })}
                  </div>
                  {SOCIAL_FIELDS.map(({ key, label, Icon }) => {
                    const field = `${key}_url` as SocialField;
                    if (activeSocial !== key && !newCompany[field].trim())
                      return null;
                    return (
                      <div key={key} className="post-social-field">
                        <span
                          className="post-social-field-icon"
                          aria-hidden="true"
                        >
                          <Icon width={16} height={16} />
                        </span>
                        <input
                          type="url"
                          aria-label={`URL ${label}`}
                          placeholder={
                            key === "instagram"
                              ? "https://instagram.com/nama"
                              : "https://linkedin.com/company/nama"
                          }
                          value={newCompany[field]}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              [field]: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="post-social-clear"
                          aria-label={`Hapus ${label}`}
                          onClick={() => {
                            setNewCompany({ ...newCompany, [field]: "" });
                            setActiveSocial((cur) =>
                              cur === key ? null : cur,
                            );
                          }}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <DropZone
                  label="Logo perusahaan"
                  variant="logo"
                  value={newCompany.logo_url}
                  onChange={(next) =>
                    setNewCompany({ ...newCompany, logo_url: next })
                  }
                />
                <DropZone
                  label="Cover image"
                  variant="cover"
                  value={newCompany.cover_image}
                  onChange={(next) =>
                    setNewCompany({ ...newCompany, cover_image: next })
                  }
                />

                <label className="post-field post-field-wide">
                  Deskripsi perusahaan
                  <textarea
                    rows={3}
                    placeholder="Profil singkat, bidang usaha, budaya kerja…"
                    value={newCompany.description ?? ""}
                    onChange={(e) =>
                      setNewCompany({
                        ...newCompany,
                        description: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </>
          )}
        </section>

        {/* ---------------- Location ---------------- */}
        <section className="post-card">
          <h2 className="post-card-title">2. Lokasi kerja</h2>
          {district ? (
            <div className="post-picked">
              <div>
                <strong>{district.name}</strong>
                <p className="post-picked-desc">
                  {district.city} · Kode {district.code}
                </p>
              </div>
              <button
                type="button"
                className="post-remove"
                aria-label="Batalkan pilihan lokasi"
                onClick={() => setDistrict(null)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            // Same single-bar combobox as the company picker.
            <div className="post-combo" ref={districtComboRef}>
              <button
                type="button"
                className="post-combo-bar"
                aria-expanded={districtOpen}
                aria-haspopup="listbox"
                onClick={() => setDistrictOpen((open) => !open)}
              >
                <span>Pilih lokasi kerja…</span>
                <ChevronDown
                  size={16}
                  className={`post-combo-chevron${districtOpen ? " open" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {districtOpen && (
                <div className="post-combo-panel">
                  {districtCustom ? (
                    <div className="post-district-custom">
                      <p className="post-district-custom-title">
                        Buat kecamatan sendiri
                      </p>
                      <label className="post-field">
                        Kode kecamatan (7 digit) *
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={7}
                          placeholder="1101001"
                          value={customCode}
                          onChange={(e) =>
                            setCustomCode(
                              e.target.value.replace(/\D/g, "").slice(0, 7),
                            )
                          }
                        />
                      </label>
                      <label className="post-field">
                        Nama kecamatan *
                        <input
                          type="text"
                          placeholder="Nama kecamatan"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                      </label>
                      <label className="post-field">
                        Kota / Kabupaten *
                        <input
                          type="text"
                          placeholder="Kota atau kabupaten"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                        />
                      </label>
                      {districtError && (
                        <p className="post-district-error" role="alert">
                          {districtError}
                        </p>
                      )}
                      <div className="post-district-actions">
                        <button
                          type="button"
                          className="post-custom-cancel"
                          onClick={() => {
                            setDistrictCustom(false);
                            setDistrictError(null);
                          }}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          className="post-custom-save"
                          disabled={districtSaving}
                          onClick={handleCreateDistrict}
                        >
                          {districtSaving ? "Menyimpan…" : "Simpan lokasi"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={districtSearchRef}
                        type="search"
                        placeholder="Ketik nama kecamatan atau kota…"
                        aria-label="Cari lokasi"
                        value={districtQuery}
                        onChange={(e) => setDistrictQuery(e.target.value)}
                      />
                      <ul
                        className="post-options"
                        role="listbox"
                        aria-label="Kecamatan"
                      >
                        {districts.slice(0, 12).map((d) => (
                          <li key={d.code}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => {
                                setDistrict(d);
                                setDistrictOpen(false);
                              }}
                            >
                              {d.name}{" "}
                              <span className="post-option-sub">
                                — {d.city}
                              </span>
                            </button>
                          </li>
                        ))}
                        {districts.length === 0 && (
                          <li className="post-options-empty">
                            Kecamatan tidak ditemukan.
                          </li>
                        )}
                        {/* Custom entry lives in the menu, as the last row. */}
                        <li>
                          <button
                            type="button"
                            className="post-option-new"
                            onClick={() => setDistrictCustom(true)}
                          >
                            <Plus size={13} aria-hidden="true" />
                            Tambah kecamatan sendiri
                          </button>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Optional street-level address, independent of the district choice. */}
          <label className="post-field post-field-wide post-address">
            Alamat spesifik (opsional)
            <input
              type="text"
              placeholder="Jl. Sudirman No. 12, RT/RW, gedung, lantai…"
              maxLength={300}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </label>
        </section>

        {/* ---------------- Job details ---------------- */}
        <section className="post-card">
          <h2 className="post-card-title">3. Detail pekerjaan</h2>
          <div className="post-grid">
            <label className="post-field post-field-wide">
              Judul pekerjaan *
              <input
                ref={titleRef}
                type="text"
                placeholder="Frontend Developer"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="post-field post-field-wide">
              Deskripsi *
              <textarea
                rows={5}
                placeholder="Ringkasan pekerjaan, konteks tim, keuntungan…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="post-field post-field-wide">
              Persyaratan
              <textarea
                rows={3}
                placeholder="Satu persyaratan per baris…"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </label>
            <label className="post-field post-field-wide">
              Tanggung jawab
              <textarea
                rows={3}
                placeholder="Satu tanggung jawab per baris…"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
              />
            </label>
            <label className="post-field">
              Pendidikan minimum
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value as EducationLevel)}
              >
                {(["any", "smp", "sma_smk"] as EducationLevel[]).map(
                  (level) => (
                    <option key={level} value={level}>
                      {educationLabel(level)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="post-field">
              Pengalaman (tahun)
              <input
                type="number"
                min={0}
                max={50}
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value) || 0)}
              />
            </label>
            <label className="post-field">
              Masa buka (hari)
              <input
                type="number"
                min={1}
                max={365}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value) || 30)}
              />
            </label>
            <label className="post-field">
              Batas akhir lamaran
              <input
                type="date"
                value={deadline}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
          </div>
          <p className="post-hint">
            Tanpa batas akhir di atas, tanggal kedaluwarsa dihitung otomatis
            dari masa buka.
          </p>
        </section>

        {/* ---------------- Skills ---------------- */}
        <section className="post-card">
          <h2 className="post-card-title">4. Keahlian yang dibutuhkan</h2>
          <div className="post-skills-input">
            {skills.length > 0 && (
              <ul className="post-skills-chips">
                {skills.map((skill) => (
                  <SkillBadge
                    key={skill}
                    name={skill}
                    onRemove={() =>
                      setSkills(skills.filter((s) => s !== skill))
                    }
                  />
                ))}
              </ul>
            )}
            <input
              ref={skillsInputRef}
              type="text"
              list="post-skill-suggestions"
              placeholder="Pilih dari saran atau ketik keahlian sendiri, tekan Enter"
              aria-label="Tambah keahlian"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onBlur={commitSkillDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(skillDraft);
                } else if (
                  e.key === "Backspace" &&
                  !skillDraft &&
                  skills.length
                ) {
                  setSkills(skills.slice(0, -1));
                }
              }}
            />
            <datalist id="post-skill-suggestions">
              {SUGGESTED_SKILLS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {remainingSuggestions.length > 0 && (
            <div className="post-skills-suggest">
              <span className="post-skills-suggest-label">Saran:</span>
              {remainingSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="post-skill-add"
                  onClick={() => addSkill(s)}
                >
                  <Plus size={11} aria-hidden="true" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- Submit ---------------- */}
        {errors.length > 0 && (
          <div className="post-errors" role="alert">
            {errors.map((msg) => (
              <p key={msg}>{msg}</p>
            ))}
          </div>
        )}

        <div className="post-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Batal
          </button>
          <button type="submit" className="btn-solid" disabled={submitting}>
            {submitting ? "Menyimpan…" : "Pasang lowongan"}
          </button>
        </div>
      </form>
    </div>
  );
}
