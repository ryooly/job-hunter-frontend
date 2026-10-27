import {
  educationLabel,
  experienceLabel,
  formatDate,
  initials,
} from "../utils/format";
import type { JobVacancy } from "../types";
import {
  BookmarkIcon,
  CalendarIcon,
  MoneyIcon,
  PinIcon,
  SendIcon,
} from "./Icons";

interface JobCardProps {
  vacancy: JobVacancy;
  saved: boolean;
  onToggleBookmark: (id: number) => void;
  /** Apply a filter from a card chip (see resolveCategory ids). */
  onFilterChip: (id: string) => void;
}

export function JobCard({
  vacancy,
  saved,
  onToggleBookmark,
  onFilterChip,
}: JobCardProps) {
  const company = vacancy.company?.name ?? "Perusahaan";
  const district = vacancy.district;
  const location = district ? `${district.name}, ${district.city}` : "";
  const deadline = formatDate(vacancy.application_deadline);
  const posted = formatDate(vacancy.created_at);

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-logo" aria-hidden="true">
          {vacancy.company?.logo_url ? (
            <img src={vacancy.company.logo_url} alt="" loading="lazy" />
          ) : (
            initials(company)
          )}
        </div>

        <div className="job-card-headings">
          <a className="job-title" href={`#job-${vacancy.id}`}>
            {vacancy.title}
          </a>
          <p className="company-name">{company}</p>
        </div>

        <button
          type="button"
          className={`bookmark-btn${saved ? " saved" : ""}`}
          aria-label={saved ? "Remove bookmark" : "Bookmark this job"}
          aria-pressed={saved}
          onClick={() => onToggleBookmark(vacancy.id)}
        >
          <BookmarkIcon width={18} height={18} filled={saved} />
        </button>
      </div>

      <div className="job-meta">
        {district && (
          <button
            type="button"
            className="job-meta-row job-meta-btn"
            title={`Filter lokasi: ${district.name}`}
            onClick={() =>
              onFilterChip(`dist:${encodeURIComponent(district.name)}`)
            }
          >
            <PinIcon width={14} height={14} />
            <span>{location}</span>
          </button>
        )}
        <button
          type="button"
          className="job-meta-row job-meta-btn"
          title="Filter level gaji"
          onClick={() => onFilterChip("gaji:unannounced")}
        >
          <MoneyIcon width={14} height={14} />
          <span>Gaji Tidak Diumumkan</span>
        </button>
        <div className="job-meta-row">
          <CalendarIcon width={14} height={14} />
          <span>
            {deadline ? `Batas: ${deadline}` : "Dibuka hingga terisi"}
          </span>
        </div>
      </div>

      <div className="job-tags">
        <button
          type="button"
          className="tag tag-btn"
          title="Filter pendidikan minimum"
          onClick={() => onFilterChip(`edu:${vacancy.min_education_level}`)}
        >
          {educationLabel(vacancy.min_education_level)}
        </button>
        <button
          type="button"
          className="tag tag-accent tag-btn"
          title="Filter pengalaman"
          onClick={() => onFilterChip(`exp:${vacancy.min_experience_years}`)}
        >
          {experienceLabel(vacancy.min_experience_years)}
        </button>
      </div>

      <div className="job-card-footer">
        {posted && <span className="job-posted">Diposting {posted}</span>}
        <button type="button" className="btn-apply-sm">
          Lamar
          <SendIcon width={13} height={13} />
        </button>
      </div>
    </article>
  );
}
