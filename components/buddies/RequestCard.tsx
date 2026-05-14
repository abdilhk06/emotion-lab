import { RequestActions } from "@/components/buddies/RequestActions";

export type RequestStatus = "pending" | "accepted" | "rejected";

export type BuddyRequestItem = {
  id: string;
  senderId: string;
  receiverId: string;
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

  return (
    <article className="request-card">
      <div className="req-header">
        <div className="req-avatar" aria-hidden="true">{initials}</div>
        <div className="req-info">
          <h3>{item.profile.pseudo}</h3>
          <span className="req-meta">MBTI · {item.profile.studyLevel} · 82% compat</span>
        </div>
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
        }
        .req-meta {
          color: #66738e;
          font-size: 13px;
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
      `}</style>
    </article>
  );
}
