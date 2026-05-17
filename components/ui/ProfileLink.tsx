import Link from "next/link";
import type { ReactNode } from "react";

type ProfileLinkProps = {
  profileId: string | null | undefined;
  username: string;
  className?: string;
  children?: ReactNode;
};

export function ProfileLink({ profileId, username, className = "", children }: ProfileLinkProps) {
  if (!profileId) {
    return children
      ? <span className={className}>{children}</span>
      : <span className="font-bold text-gray-900">{username}</span>;
  }

  return (
    <Link
      href={`/buddies/${profileId}`}
      aria-label={`Voir le profil de ${username}`}
      title={`Voir le profil de ${username}`}
      className={`profile-link group ${className}`}
    >
      {children ?? (
        <span className="user-card-name">
          @{username}
        </span>
      )}
    </Link>
  );
}
