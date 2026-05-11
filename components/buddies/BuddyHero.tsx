"use client";

import { CompatibilityBadge } from "@/components/buddies/CompatibilityBadge";

type BuddyHeroProps = {
  pseudo: string;
  studyLevel: string;
  mbtiCode: string | null;
  mbtiName: string | null;
  compatibility: number;
};

function initialsFromPseudo(pseudo: string): string {
  const clean = pseudo.trim().replace(/^@/, "");
  if (!clean) return "?";
  return clean.charAt(0).toUpperCase();
}

export function BuddyHero({ pseudo, studyLevel, mbtiCode, mbtiName, compatibility }: BuddyHeroProps) {
  return (
    <section className="buddy-hero">
      <div className="buddy-hero-avatar" aria-hidden="true">
        {initialsFromPseudo(pseudo)}
      </div>
      <h2>{pseudo}</h2>
      <p className="buddy-hero-meta">
        {mbtiCode ? `${mbtiCode}${mbtiName ? ` - ${mbtiName}` : ""}` : "Profil MBTI non renseigne"} - {studyLevel}
      </p>
      <CompatibilityBadge score={compatibility} />
    </section>
  );
}
