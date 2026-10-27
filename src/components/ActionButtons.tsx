import { Briefcase, User, UserPlus } from "lucide-react";

interface ActionButtonsProps {
  /** Whether an account is signed in — switches the right button's meaning. */
  authed: boolean;
  /** Left button: post a job listing. */
  onPostJob: () => void;
  /** Right button: create a profile (signed out) or open it (signed in). */
  onProfile: () => void;
}

/**
 * Two side-by-side calls-to-action shown beneath the filter bar: posting a
 * job on the left, and a profile entry point on the right that becomes
 * "create profile" when signed out and "my profile" when signed in.
 */
export function ActionButtons({
  authed,
  onPostJob,
  onProfile,
}: ActionButtonsProps) {
  return (
    <div className="action-row">
      <button
        type="button"
        className="action-btn action-btn-solid"
        onClick={onPostJob}
      >
        <Briefcase size={14} aria-hidden="true" />
        Pasang Lowongan
      </button>
      <button
        type="button"
        className="action-btn action-btn-outline"
        onClick={onProfile}
      >
        {authed ? (
          <User size={14} aria-hidden="true" />
        ) : (
          <UserPlus size={14} aria-hidden="true" />
        )}
        {authed ? "Profil Saya" : "Buat Profil"}
      </button>
    </div>
  );
}
