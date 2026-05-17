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
    <div className="flex flex-row items-center gap-3">
      <Avatar className="size-11 ring-2 ring-purple-100 shadow-sm">
        <AvatarFallback>{getInitial(username)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex flex-col gap-0.5">
        {profileId ? (
          <ProfileLink profileId={profileId} username={username}>
            <span className="font-bold text-[#7b2d8b] underline decoration-dotted underline-offset-[3px] decoration-[1.5px] transition-all duration-150 group-hover:text-[#5a1f68] group-hover:decoration-solid">
              @{username}
            </span>
          </ProfileLink>
        ) : (
          <span className="font-bold text-gray-900">@{username}</span>
        )}

        {subtitle && (
          <p className="truncate text-sm text-muted-foreground leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
