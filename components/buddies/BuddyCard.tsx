"use client";

type BuddyCardProps = {
  id: string;
  pseudo: string;
  studyLevel: string;
  bio: string;
  sharedHobbies: string[];
  compatibility: number;
  mbti?: string;
};

function initialsFromPseudo(pseudo: string): string {
  const trimmed = pseudo.trim();
  if (!trimmed) return "?";
  return trimmed.replace(/^@/, "").charAt(0).toUpperCase();
}

export function BuddyCard({ pseudo, studyLevel, bio, sharedHobbies, compatibility, mbti = "MBTI" }: BuddyCardProps) {
  return (
    <article className="buddy-dir-card">
      <span className="compat-badge">{compatibility}%</span>
      <div className="card-header">
        <div className="avatar" aria-hidden="true">
          {initialsFromPseudo(pseudo)}
        </div>
        <div>
          <h3>{pseudo}</h3>
          <span className="meta">{mbti} · {studyLevel}</span>
        </div>
      </div>
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
      <button className="btn-send" type="button">Envoyer une demande</button>
    </article>
  );
}
