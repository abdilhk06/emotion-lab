import { UserAvatar } from "@/components/ui/UserAvatar";
import { ProfileLink } from "@/components/ui/ProfileLink";

type UserCardProps = {
  profileId?: string;
  username: string;
  mbti?: string;
  level?: string;
  avatarPath?: string | null;
};

export function UserCard({
  profileId,
  username,
  mbti,
  level = "Niveau non précisé",
  avatarPath = null,
}: UserCardProps) {
  const subtitle = [mbti, level].filter(Boolean).join(" · ");

  return (
    <div className="user-card">
      <UserAvatar name={username} avatarPath={avatarPath} size={36} />

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
