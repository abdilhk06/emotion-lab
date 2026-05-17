import Link from "next/link";
import { RequestActions } from "@/components/buddies/RequestActions";

export type RequestStatus = "pending" | "accepted" | "rejected";

export type BuddyRequestItem = {
  id: string;
  senderId: string;
  receiverId: string;
  profileId: string | null;
  message: string | null;
  status: RequestStatus;
  createdAt: string;
  profile: {
    pseudo: string;
    studyLevel: string;
  };
};

type RequestCardProps = {
  item: BuddyRequestItem;
  mode: "received" | "sent";
  busyAction: "accept" | "reject" | null;
  disabled?: boolean;
  successMessage?: string | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

function getInitials(pseudo: string): string {
  const raw = pseudo.replace(/^@/, "").trim();
  if (!raw) return "?";
  const chunks = raw.split(/[\s._-]+/).filter(Boolean);
  const initials = chunks.slice(0, 2).map((chunk) => chunk[0]?.toUpperCase() ?? "").join("");
  return initials || raw.slice(0, 2).toUpperCase();
}

function formatDateLabel(dateValue: string): string {
  const dt = new Date(dateValue);
  if (Number.isNaN(dt.getTime())) return "Date inconnue";
  const diff = Date.now() - dt.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Aujourd'hui";
  if (diff < 2 * day) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(dt);
}

export function RequestCard({ item, mode, busyAction, disabled, successMessage, onAccept, onReject }: RequestCardProps) {
  const initials = getInitials(item.profile.pseudo);
  const canAct = mode === "received" && item.status === "pending";
  const profileHref = item.profileId ? `/buddies/${item.profileId}` : null;
  const profileLabel = `Voir le profil de ${item.profile.pseudo}`;
  const identityContent = (
    <>
      <div className="req-avatar" aria-hidden="true">{initials}</div>
      <div className="req-info">
        <h3>{item.profile.pseudo}</h3>
        <span className="req-meta">MBTI · {item.profile.studyLevel} · 82% compat</span>
      </div>
      <span className="req-profile-pill" aria-hidden="true">Profil</span>
    </>
  );

  return (
    <article className="request-card">
      <div className="req-header">
        {profileHref ? (
          <Link className="req-identity-link" href={profileHref} aria-label={profileLabel} title={profileLabel}>
            {identityContent}
          </Link>
        ) : (
          <div className="req-identity-static">{identityContent}</div>
        )}
        <span className="req-time">{formatDateLabel(item.createdAt)}</span>
      </div>

      {item.message ? <blockquote className="req-message">« {item.message} »</blockquote> : <blockquote className="req-message">« J&apos;aimerais rejoindre ton cercle Buddy. »</blockquote>}

      <RequestActions
        canAct={canAct}
        busyAction={busyAction}
        disabled={disabled}
        successMessage={successMessage}
        onAccept={() => onAccept(item.id)}
        onReject={() => onReject(item.id)}
      />

      <style jsx>{`
        .request-card {
          background: #fff;
          border: 1px solid #e4dcea;
          border-radius: 16px;
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .req-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .req-identity-link,
        .req-identity-static {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
          max-width: min(100%, 520px);
        }
        .req-identity-link {
          border-radius: 999px;
          padding: 5px 10px 5px 5px;
          margin: -5px -10px -5px -5px;
          transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }
        .req-identity-link:hover,
        .req-identity-link:focus-visible {
          background: #faf2f7;
          box-shadow: 0 8px 24px rgba(138, 59, 101, 0.12);
        }
        .req-identity-link:hover h3,
        .req-identity-link:focus-visible h3 {
          color: #8a3b65;
        }
        .req-identity-link:focus-visible {
          outline: 3px solid rgba(138, 59, 101, 0.28);
          outline-offset: 3px;
        }
        .req-avatar {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          background: linear-gradient(135deg, #9d4b7a, #2f91bd);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          overflow: hidden;
        }
        .req-info {
          min-width: 0;
        }
        .req-info h3 {
          margin: 0;
          font-size: 16px;
          color: #07123a;
          transition: color 160ms ease;
        }
        .req-meta {
          color: #66738e;
          font-size: 13px;
        }
        .req-profile-pill {
          border: 1px solid #ead9e5;
          border-radius: 999px;
          color: #8a3b65;
          background: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1;
          padding: 6px 8px;
          opacity: 0.78;
          transform: translateX(-2px);
          transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
          white-space: nowrap;
        }
        .req-identity-link:hover .req-profile-pill,
        .req-identity-link:focus-visible .req-profile-pill {
          background: #f5dde9;
          opacity: 1;
          transform: translateX(0);
        }
        .req-time {
          margin-left: auto;
          color: #9aa4b8;
          font-size: 13px;
        }
        .req-message {
          margin: 0;
          padding: 12px 14px;
          background: #faf7fc;
          border-left: 3px solid #e4dcea;
          border-radius: 8px;
          font-style: italic;
          color: #26365a;
        }
        @media (max-width: 599px) {
          .req-header {
            align-items: flex-start;
          }
          .req-profile-pill {
            display: none;
          }
          .req-identity-link,
          .req-identity-static {
            max-width: calc(100% - 70px);
          }
        }
      `}</style>
    </article>
  );
}
