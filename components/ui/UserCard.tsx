import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

export function UserCard({ profileId, username, mbti = "MBTI non précisé", level = "Niveau non précisé" }: UserCardProps) {
  return (
    <div className="flex flex-row items-center gap-3">
      <Avatar className="size-10">
        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 font-bold text-white">
          {getInitial(username)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        {profileId ? (
          <ProfileLink profileId={profileId} username={username} className="rounded-none">
            <span className="font-bold text-[#7b2d8b] underline decoration-dotted underline-offset-[3px] transition-colors hover:text-[#5a1f68] hover:decoration-solid">
              {username}
            </span>
          </ProfileLink>
        ) : (
          <span className="font-bold">{username}</span>
        )}
        <div className="flex min-w-0 items-center gap-1 text-muted-foreground text-sm">
          <Badge className="border-0 bg-transparent p-0 text-sm font-normal text-muted-foreground shadow-none">
            {mbti}
          </Badge>
          <span aria-hidden="true">·</span>
          <span className="truncate">{level}</span>
        </div>
      </div>
    </div>
  );
}
