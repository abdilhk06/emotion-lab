import Link from "next/link";
import type { ReactNode } from "react";

type ProfileLinkProps = {
  profileId: string | null | undefined;
  username: string;
  className?: string;
  children?: ReactNode;
};

export function ProfileLink({ profileId, username, className, children }: ProfileLinkProps) {
  if (!profileId) {
    return (
      <>
        {children ? <span className={className}>{children}</span> : <span className="profile-link-fallback">{username}</span>}
        <ProfileLinkStyles />
      </>
    );
  }

  const label = `Voir le profil de ${username}`;

  return (
    <>
      <Link className={`profile-link ${className ?? ""}`.trim()} href={`/buddies/${profileId}`} aria-label={label} title={label}>
        {children ?? (
          <span className="profile-link-handle">
            {username}
            <span className="profile-link-arrow" aria-hidden="true">→</span>
          </span>
        )}
      </Link>
      <ProfileLinkStyles />
    </>
  );
}

function ProfileLinkStyles() {
  return (
      <style jsx global>{`
        .profile-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: inherit;
          text-decoration: none;
          border-radius: 999px;
        }

        .profile-link:focus-visible {
          outline: 3px solid rgba(123, 45, 139, 0.28);
          outline-offset: 3px;
        }

        .profile-link-handle {
          color: #7b2d8b;
          font-weight: 800;
          text-decoration-line: underline;
          text-decoration-style: dotted;
          text-underline-offset: 3px;
          text-decoration-thickness: 1.5px;
          transition: color 160ms ease, text-decoration-style 160ms ease;
        }

        .profile-link:hover .profile-link-handle,
        .profile-link:focus-visible .profile-link-handle {
          color: #5a1f68;
          text-decoration-style: solid;
        }

        .profile-link-arrow {
          display: inline-block;
          margin-left: 4px;
          opacity: 0;
          transform: translateX(-3px);
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .profile-link:hover .profile-link-arrow,
        .profile-link:focus-visible .profile-link-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .profile-link-fallback {
          color: #07123a;
          font-weight: 800;
        }
      `}</style>
  );
}
