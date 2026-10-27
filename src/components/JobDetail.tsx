import { useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { educationLabel, experienceLabel, initials } from "../utils/format";
import type { JobVacancy } from "../types";
import { useVacancyDetail } from "../hooks/useVacancyDetail";
import { useCountdown } from "../hooks/useCountdown";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  CapIcon,
  CheckCircleIcon,
  ClipboardIcon,
  ClockIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MoneyIcon,
  PinIcon,
  SendIcon,
  ShareIcon,
  ZapIcon,
} from "./Icons";
import { SkillBadge } from "./SkillBadge";

interface JobDetailProps {
  vacancyId: number;
  saved: boolean;
  onToggleBookmark: (id: number) => void;
  /** Apply a filter from a detail chip and return to the filtered list. */
  onFilterChip: (id: string) => void;
}

/** "5 Okt 2026"-style date with year. */
function longDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Split free text into clean, non-empty lines (bullets stripped). */
function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function DetailSkeleton() {
  return (
    <div className="detail-skeleton" role="status" aria-label="Memuat lowongan">
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line" style={{ width: "45%" }} />
      <div className="skeleton-block" />
      <div className="skeleton-block" />
    </div>
  );
}

function DetailError() {
  return (
    <div className="detail-section detail-error">
      <h2>Lowongan tidak ditemukan</h2>
      <p>
        Maaf, lowongan ini tidak tersedia atau sedang dimuat ulang dari server.
      </p>
      <a className="btn-outline" href="#jobs">
        Kembali ke semua lowongan
      </a>
    </div>
  );
}

function Chip({
  Icon,
  children,
  onClick,
  title,
}: {
  Icon: typeof PinIcon;
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const inner = (
    <>
      <Icon width={14} height={14} />
      {children}
    </>
  );
  if (!onClick) {
    return <span className="detail-chip">{inner}</span>;
  }
  return (
    <button
      type="button"
      className="detail-chip detail-chip-btn"
      title={title}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

function LinkChip({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: typeof GlobeIcon;
  label: string;
}) {
  return (
    <a
      className="company-link-chip"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <Icon width={15} height={15} />
      {label}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function InfoLinkRow({ label, href }: { label: string; href: string }) {
  const display = href.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd>
        <a className="info-link" href={href} target="_blank" rel="noreferrer">
          {display}
        </a>
      </dd>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`status-badge${active ? " status-active" : " status-inactive"}`}
    >
      <span className="status-dot" aria-hidden="true" />
      {active ? "Aktif" : "Tidak Aktif"}
    </span>
  );
}

function DeadlineRow({
  deadline,
  deadlineRaw,
}: {
  deadline: string | null;
  deadlineRaw: string | null;
}) {
  const countdown = useCountdown(deadlineRaw);

  if (!deadline) {
    return (
      <div className="deadline-row deadline-open">
        <CalendarIcon width={16} height={16} />
        <span>Dibuka hingga posisi terisi</span>
      </div>
    );
  }

  const urgencyClass = countdown ? ` deadline-${countdown.urgency}` : "";

  return (
    <div className={`deadline-row${urgencyClass}`}>
      <CalendarIcon width={16} height={16} />
      <span>
        Batas akhir: <strong>{deadline}</strong>
      </span>
    </div>
  );
}

export function JobDetail({
  vacancyId,
  saved,
  onToggleBookmark,
  onFilterChip,
}: JobDetailProps) {
  const { vacancy, loading, error } = useVacancyDetail(vacancyId);

  return (
    <div className="job-detail">
      <div className="container">
        <a className="detail-back" href="#jobs">
          ← Kembali ke semua lowongan
        </a>

        {loading && <DetailSkeleton />}
        {!loading && error && <DetailError />}
        {!loading && !error && vacancy && (
          <DetailBody
            vacancy={vacancy}
            saved={saved}
            onToggleBookmark={onToggleBookmark}
            onFilterChip={onFilterChip}
          />
        )}
      </div>
    </div>
  );
}

function CompanyDesc({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const lines = description ? toLines(description) : [];
  const collapsedCount = 2;
  const hasMore = lines.length > collapsedCount;
  const visible = expanded || !hasMore ? lines : lines.slice(0, collapsedCount);

  return (
    <div className="company-desc">
      <h3 className="company-desc-title">Tentang Perusahaan</h3>
      {lines.length > 0 ? (
        <>
          <div
            className={`company-desc-body${!expanded && hasMore ? " clamped" : ""}`}
          >
            {visible.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="read-more-btn"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Tutup" : "Baca Selengkapnya"}
            </button>
          )}
        </>
      ) : (
        <p>
          Belum ada deskripsi perusahaan. Informasi ini akan muncul setelah
          perusahaan melengkapinya.
        </p>
      )}
    </div>
  );
}

function DetailBody({
  vacancy,
  saved,
  onToggleBookmark,
  onFilterChip,
}: {
  vacancy: JobVacancy;
  saved: boolean;
  onToggleBookmark: (id: number) => void;
  onFilterChip: (id: string) => void;
}) {
  const company = vacancy.company?.name ?? "Perusahaan";
  const district = vacancy.district;
  const location = district
    ? `${district.name}, ${district.city}`
    : "Lokasi tidak disebutkan";
  const deadline = longDate(vacancy.application_deadline);
  const posted = longDate(vacancy.created_at);

  const website = vacancy.company?.website ?? null;
  const instagram = vacancy.company?.instagram_url ?? null;
  const linkedin = vacancy.company?.linkedin_url ?? null;
  const hasLinks = Boolean(website || instagram || linkedin);

  // Share the vacancy: native share sheet where available, otherwise copy
  // the current URL to the clipboard and briefly flag it as copied.
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: vacancy.title,
          text: `${vacancy.title} — ${company}`,
          url,
        });
        return;
      } catch {
        // Share sheet dismissed or unavailable — fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked; nothing further to do.
    }
  };

  return (
    <>
      <div className="detail-grid">
        <div className="detail-main">
          <article className="detail-hero">
            <div
              className="detail-cover"
              style={
                vacancy.company?.cover_image
                  ? {
                      backgroundImage: `url(${vacancy.company.cover_image})`,
                    }
                  : undefined
              }
              aria-hidden="true"
            >
              <button
                type="button"
                className={`detail-bookmark${saved ? " saved" : ""}`}
                aria-label={saved ? "Remove bookmark" : "Bookmark this job"}
                aria-pressed={saved}
                onClick={() => onToggleBookmark(vacancy.id)}
              >
                <BookmarkIcon width={18} height={18} filled={saved} />
              </button>
            </div>

            <div className="detail-hero-body">
              {/* 1. Company profile comes first. */}
              <div className="company-id-row">
                <div
                  className="company-logo company-logo-lg"
                  aria-hidden="true"
                >
                  {vacancy.company?.logo_url ? (
                    <img src={vacancy.company.logo_url} alt="" loading="lazy" />
                  ) : (
                    initials(company)
                  )}
                </div>
                <div className="detail-heading">
                  <div className="detail-heading-top">
                    <h1>{company}</h1>
                    <StatusBadge active={vacancy.is_active} />
                  </div>
                  <p className="detail-sub">
                    {vacancy.district ? `${location} · Indonesia` : "Indonesia"}
                  </p>
                </div>
              </div>

              {hasLinks ? (
                <div className="company-links">
                  {website && (
                    <LinkChip
                      href={website}
                      Icon={GlobeIcon}
                      label={website
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                    />
                  )}
                  {instagram && (
                    <LinkChip
                      href={instagram}
                      Icon={InstagramIcon}
                      label="Instagram"
                    />
                  )}
                  {linkedin && (
                    <LinkChip
                      href={linkedin}
                      Icon={LinkedInIcon}
                      label="LinkedIn"
                    />
                  )}
                </div>
              ) : (
                <p className="company-links-empty">
                  Perusahaan ini belum memiliki situs resmi atau media sosial.
                </p>
              )}

              <CompanyDesc description={vacancy.company?.description ?? null} />

              <DeadlineRow
                deadline={deadline}
                deadlineRaw={vacancy.application_deadline}
              />

              <hr className="role-divider" />

              {/* 2. The specific vacancy sits under the company block. */}
              <div className="role-block">
                <p className="role-eyebrow">Posisi yang dibuka</p>
                <h2 className="role-title">{vacancy.title}</h2>

                <div className="detail-chips">
                  {district ? (
                    <Chip
                      Icon={PinIcon}
                      title={`Filter lokasi: ${district.name}`}
                      onClick={() =>
                        onFilterChip(
                          `dist:${encodeURIComponent(district.name)}`,
                        )
                      }
                    >
                      {location}, Indonesia
                    </Chip>
                  ) : (
                    <Chip Icon={PinIcon}>{location}</Chip>
                  )}
                  {vacancy.street_address && (
                    <Chip Icon={PinIcon} title="Alamat spesifik">
                      {vacancy.street_address}
                    </Chip>
                  )}
                  <Chip
                    Icon={MoneyIcon}
                    title="Filter level gaji"
                    onClick={() => onFilterChip("gaji:unannounced")}
                  >
                    Gaji Tidak Diumumkan
                  </Chip>
                  <Chip
                    Icon={CapIcon}
                    title="Filter pendidikan minimum"
                    onClick={() =>
                      onFilterChip(`edu:${vacancy.min_education_level}`)
                    }
                  >
                    {educationLabel(vacancy.min_education_level)}
                  </Chip>
                  <Chip
                    Icon={ClockIcon}
                    title="Filter pengalaman"
                    onClick={() =>
                      onFilterChip(`exp:${vacancy.min_experience_years}`)
                    }
                  >
                    {experienceLabel(vacancy.min_experience_years)}
                  </Chip>
                </div>

                <div className="detail-hero-actions">
                  <button type="button" className="btn-solid btn-apply">
                    Lamar Sekarang
                    <SendIcon width={15} height={15} />
                  </button>
                  {posted && (
                    <span className="detail-posted">Diposting {posted}</span>
                  )}
                </div>
              </div>
            </div>
          </article>

          <section className="detail-section">
            <h2>
              <BriefcaseIcon width={18} height={18} /> Tentang Pekerjaan Ini
            </h2>
            {toLines(vacancy.description).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </section>

          {vacancy.skills_list && vacancy.skills_list.length > 0 && (
            <section className="detail-section">
              <h2>
                <ZapIcon width={18} height={18} /> Keahlian yang Dibutuhkan
              </h2>
              <ul className="skill-grid">
                {vacancy.skills_list.map((skill) => (
                  <SkillBadge key={skill} name={skill} />
                ))}
              </ul>
            </section>
          )}

          {vacancy.responsibilities && (
            <section className="detail-section">
              <h2>
                <ClipboardIcon width={18} height={18} /> Tanggung Jawab
              </h2>
              <ul className="detail-list">
                {toLines(vacancy.responsibilities).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {vacancy.requirements && (
            <section className="detail-section">
              <h2>
                <CheckCircleIcon width={18} height={18} /> Kualifikasi
              </h2>
              <ul className="detail-list">
                {toLines(vacancy.requirements).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="detail-side">
          <div className="side-card">
            <h3>Informasi Perusahaan</h3>
            <dl className="info-list">
              <InfoRow label="Nama" value={company} />
              <InfoRow
                label="Lokasi Kerja"
                value={
                  vacancy.street_address
                    ? `${vacancy.street_address}, ${location}`
                    : location
                }
              />
              {website && <InfoLinkRow label="Website" href={website} />}
              <div className="info-row">
                <dt>Status</dt>
                <dd>
                  <StatusBadge active={vacancy.is_active} />
                </dd>
              </div>
            </dl>
          </div>

          <div className="side-card">
            <h3>Informasi Penting</h3>
            <dl className="info-list">
              <InfoRow
                label="Pendidikan"
                value={educationLabel(vacancy.min_education_level)}
              />
              <InfoRow
                label="Pengalaman"
                value={experienceLabel(vacancy.min_experience_years)}
              />
              {posted && <InfoRow label="Diposting" value={posted} />}
            </dl>
            <DeadlineRow
              deadline={deadline}
              deadlineRaw={vacancy.application_deadline}
            />
          </div>
        </aside>
      </div>

      {/* Bottom action bar — fixed to the frame with a white background and
            rounded top corners. "Apply" leads on the left, larger than the
            secondary Save / Share controls on the right. Rendered through a
            portal into <body> so the .page transform animation cannot turn it
            into a containing block — keeping it truly viewport-fixed on scroll. */}
      {createPortal(
        <div className="detail-actionbar">
          <div className="detail-actionbar-inner">
            <button
              type="button"
              className="btn-solid btn-apply detail-action-apply"
            >
              Lamar Sekarang
              <SendIcon width={16} height={16} />
            </button>

            <button
              type="button"
              className={`detail-action-icon${saved ? " saved" : ""}`}
              onClick={() => onToggleBookmark(vacancy.id)}
              aria-pressed={saved}
              aria-label={saved ? "Hapus simpanan" : "Simpan lowongan"}
              title={saved ? "Tersimpan" : "Simpan"}
            >
              <BookmarkIcon width={20} height={20} filled={saved} />
            </button>

            <button
              type="button"
              className="detail-action-icon"
              onClick={handleShare}
              aria-label="Bagikan lowongan"
              title={copied ? "Tersalin" : "Bagikan"}
            >
              <ShareIcon width={20} height={20} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
