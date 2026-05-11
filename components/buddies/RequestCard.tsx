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
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(dt);
}

function getStatusLabel(status: RequestStatus): string {
  if (status === "accepted") return "Acceptee";
  if (status === "rejected") return "Refusee";
  return "En attente";
}

export function RequestCard({ item, mode, busyAction, disabled, successMessage, onAccept, onReject }: RequestCardProps) {
  const initials = getInitials(item.profile.pseudo);
  const canAct = mode === "received" && item.status === "pending";

  return (
    <article className="request-card">
      <div className="request-head">
        <div className="request-avatar" aria-hidden="true">{initials}</div>
        <div className="request-meta">
          <h3>{item.profile.pseudo}</h3>
          <p>{item.profile.studyLevel}</p>
        </div>
        <div className={`request-status request-status-${item.status}`}>{getStatusLabel(item.status)}</div>
      </div>

      <p className="request-date">{formatDateLabel(item.createdAt)}</p>

      {item.message ? <p className="request-message">&quot;{item.message}&quot;</p> : <p className="request-message-empty">Aucun message ajoute.</p>}

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
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .request-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .request-avatar {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: var(--gradient-signature);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          overflow: hidden;
        }
        .request-meta {
          min-width: 0;
        }
        .request-meta h3 {
          margin: 0;
          font-size: 16px;
        }
        .request-meta p {
          margin: 0;
          color: var(--texte-clair);
          font-size: 13px;
        }
        .request-status {
          margin-left: auto;
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
          padding: 6px 10px;
        }
        .request-status-pending {
          color: #7a5d0b;
          background: #fff7e9;
        }
        .request-status-accepted {
          color: #0e9f6e;
          background: #ebfff5;
        }
        .request-status-rejected {
          color: #b42318;
          background: #fff3f2;
        }
        .request-date {
          margin: 0;
          font-size: 12px;
          color: var(--texte-clair);
        }
        .request-message,
        .request-message-empty {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
        .request-message-empty {
          font-style: italic;
        }
      `}</style>
    </article>
  );
}
