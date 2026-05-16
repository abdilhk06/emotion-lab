"use client";

import Link from "next/link";

export type BuddyRequestStatus = "none" | "pending" | "accepted" | "rejected";

type BuddyCardProps = {
  id: string;
  pseudo: string;
  studyLevel: string;
  bio: string;
  sharedHobbies: string[];
  compatibility: number;
  requestStatus: BuddyRequestStatus;
  mbti?: string;
};

function initialsFromPseudo(pseudo: string): string {
  const trimmed = pseudo.trim();
  if (!trimmed) return "?";
  return trimmed.replace(/^@/, "").charAt(0).toUpperCase();
}

function getCtaLabel(status: BuddyRequestStatus): string {
  if (status === "pending") return "Demande en attente";
  if (status === "accepted") return "Buddy accepté";
  return "Voir le profil";
}

export function BuddyCard({ id, pseudo, studyLevel, bio, sharedHobbies, compatibility, requestStatus, mbti = "MBTI" }: BuddyCardProps) {
  const href = `/buddies/${id}`;
  const ctaLabel = getCtaLabel(requestStatus);

  return (
    <article className="buddy-dir-card">
      <span className="compat-badge">{compatibility}%</span>
      <Link className="card-main-link" href={href} aria-label={`Voir le profil de ${pseudo}`}>
        <div className="card-header">
          <div className="avatar" aria-hidden="true">
            {initialsFromPseudo(pseudo)}
          </div>
          <div>
            <h3>{pseudo}</h3>
            <span className="meta">{mbti} · {studyLevel}</span>
          </div>
        </div>
      </Link>
      <p className="tagline">« {bio} »</p>
      <div className="chips">
        {sharedHobbies.length > 0 ? (
          sharedHobbies.slice(0, 3).map((hobby) => (
            <span key={hobby} className="chip">
              {hobby}
            </span>
          ))
        ) : (
          <span className="chip">✨ Découverte</span>
        )}
      </div>
      <Link className={`btn-send status-${requestStatus}`} href={href} aria-disabled={requestStatus === "pending" || requestStatus === "accepted"}>
        {ctaLabel}
      </Link>
      <style jsx>{`
        .card-main-link {
          color: inherit;
          text-decoration: none;
        }
        .btn-send {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }
        .btn-send.status-pending,
        .btn-send.status-accepted {
          background: #f8fafc;
          color: #66738e;
          border: 1px solid #e5e7eb;
          cursor: default;
        }
      `}</style>
    </article>
  );
}
