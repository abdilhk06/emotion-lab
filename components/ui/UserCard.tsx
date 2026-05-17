import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileLink } from "@/components/ui/ProfileLink";

type UserCardProps = {
  profileId?: string;
  username: string;
  mbti?: string;
  level?: string;
};

function getInitial(username: string) {
  return username.trim().replace(/^@/, "").charAt(0).toUpperCase() || "?";
}

export function UserCard({
  profileId,
  username,
  mbti,
  level = "Niveau non précisé",
}: UserCardProps) {
  const subtitle = [mbti, level].filter(Boolean).join(" · ");

  return (
    <div className="user-card">
      <Avatar>
        <AvatarFallback>{getInitial(username)}</AvatarFallback>
      </Avatar>

      <div className="user-card-info">
        {profileId ? (
          <ProfileLink profileId={profileId} username={username}>
            <span className="user-card-name">
              @{username}
            </span>
          </ProfileLink>
        ) : (
          <span className="user-card-name-plain">@{username}</span>
        )}

        {subtitle && (
          <p className="user-card-subtitle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
