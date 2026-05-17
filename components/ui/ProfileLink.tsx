import Link from "next/link";
import type { ReactNode } from "react";

type ProfileLinkProps = {
  profileId: string | null | undefined;
  username: string;
  className?: string;
  children?: ReactNode;
};

export function ProfileLink({ profileId, username, className = "", children }: ProfileLinkProps) {
  const handle = (
    <span className="inline-flex items-center gap-1 font-extrabold text-[#7b2d8b] underline decoration-dotted underline-offset-[3px] decoration-[1.5px] transition-all duration-150 group-hover:text-[#5a1f68] group-hover:decoration-solid">
      {username}
      <span className="opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true">
        →
      </span>
    </span>
  );

  if (!profileId) {
    return children ? <span className={className}>{children}</span> : <span className="font-extrabold text-[#07123a]">{username}</span>;
  }

  return (
    <Link
      href={`/buddies/${profileId}`}
      aria-label={`Voir le profil de ${username}`}
      title={`Voir le profil de ${username}`}
      className={`group inline-flex items-center gap-1 rounded-full focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(123,45,139,0.28)] ${className}`}
    >
      {children ?? handle}
    </Link>
  );
}
