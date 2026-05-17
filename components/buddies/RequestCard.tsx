import { RequestActions } from "@/components/buddies/RequestActions";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { UserCard } from "@/components/ui/UserCard";

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
    mbti?: string;
    studyLevel: string;
    avatarPath?: string | null;
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
  const canAct = mode === "received" && item.status === "pending";
  const identityContent = (
    <div className="flex items-center justify-between w-full">
      <UserCard
        profileId={item.profileId ?? undefined}
        username={item.profile.pseudo}
        mbti={item.profile.mbti}
        level={item.profile.studyLevel}
        avatarPath={item.profile.avatarPath}
      />
      <ProfileLink
        profileId={item.profileId}
        username={item.profile.pseudo}
        className="ml-3 shrink-0"
      >
        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors">
          Profil →
        </span>
      </ProfileLink>
    </div>
  );

  return (
    <article className="req-card">
      <div className="req-card-header">
        {identityContent}
        <span className="req-card-date">{formatDateLabel(item.createdAt)}</span>
      </div>

      {item.message ? <blockquote className="req-card-message">« {item.message} »</blockquote> : <blockquote className="req-card-message">« J&apos;aimerais rejoindre ton cercle Buddy. »</blockquote>}

      <RequestActions
        canAct={canAct}
        busyAction={busyAction}
        disabled={disabled}
        successMessage={successMessage}
        onAccept={() => onAccept(item.id)}
        onReject={() => onReject(item.id)}
      />
    </article>
  );
}
