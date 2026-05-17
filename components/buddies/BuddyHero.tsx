"use client";

import { CompatibilityBadge } from "@/components/buddies/CompatibilityBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";

type BuddyHeroProps = {
  pseudo: string;
  studyLevel: string;
  mbtiCode: string | null;
  mbtiName: string | null;
  compatibility: number;
  avatarPath: string | null;
};

export function BuddyHero({ pseudo, studyLevel, mbtiCode, mbtiName, compatibility, avatarPath }: BuddyHeroProps) {
  return (
    <section className="buddy-hero">
      <UserAvatar name={pseudo} avatarPath={avatarPath} size={120} className="buddy-hero-avatar" />
      <h2>{pseudo}</h2>
      <p className="buddy-hero-meta">
        {mbtiCode ? `${mbtiCode}${mbtiName ? ` - ${mbtiName}` : ""}` : "Profil MBTI non renseigne"} - {studyLevel}
      </p>
      <CompatibilityBadge score={compatibility} />
    </section>
  );
}
