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
      className={`group inline-flex items-center gap-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${className}`}
    >
      {children ?? (
        <span className="font-bold text-[#7b2d8b] underline decoration-dotted underline-offset-[3px] decoration-[1.5px] transition-all duration-150 group-hover:text-[#5a1f68] group-hover:decoration-solid">
          @{username}
        </span>
      )}
    </Link>
  );
}
