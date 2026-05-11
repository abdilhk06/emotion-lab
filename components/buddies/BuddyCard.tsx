"use client";

import Link from "next/link";

type BuddyCardProps = {
  id: string;
  pseudo: string;
  studyLevel: string;
  bio: string;
  sharedHobbies: string[];
  compatibility: number;
};

function initialsFromPseudo(pseudo: string): string {
  const trimmed = pseudo.trim();
  if (!trimmed) return "?";
  return trimmed.replace(/^@/, "").charAt(0).toUpperCase();
}

function compatibilityTone(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 65) return "mid";
  return "low";
}

export function BuddyCard({ id, pseudo, studyLevel, bio, sharedHobbies, compatibility }: BuddyCardProps) {
  const tone = compatibilityTone(compatibility);
  return (
    <article className="buddy-card">
      <span className={`buddy-compat ${tone}`}>{compatibility}%</span>
      <div className="buddy-top">
        <div className="buddy-avatar" aria-hidden="true">
          {initialsFromPseudo(pseudo)}
        </div>
        <div>
          <h3>{pseudo}</h3>
          <p>{studyLevel}</p>
        </div>
      </div>
      <p className="buddy-bio">{bio}</p>
      <div className="buddy-hobbies">
        {sharedHobbies.length > 0 ? (
          sharedHobbies.slice(0, 3).map((hobby) => (
            <span key={hobby} className="buddy-chip">
              {hobby}
            </span>
          ))
        ) : (
          <span className="buddy-chip buddy-chip-muted">Aucun hobby partage pour le moment</span>
        )}
      </div>
      <Link className="btn btn-primary" href={`/buddies/${id}`}>
        Voir le profil
      </Link>
    </article>
  );
}
