"use client";

type ProfileEditHeaderProps = {
  pseudo: string;
  studyLevel: string;
  initials: string;
};

export function ProfileEditHeader({ pseudo, studyLevel, initials }: ProfileEditHeaderProps) {
  return (
    <section className="profile-edit-header-card">
      <div className="profile-title-wrap">
        <h2>Mon profil</h2>
        <p>Les informations visibles par les autres dans l&apos;annuaire.</p>
      </div>
      <div className="profile-identity">
        <div className="avatar avatar-xl" aria-hidden>
          {initials}
        </div>
        <div>
          <h3>{pseudo.trim() ? `@${pseudo.trim()}` : "@mon_pseudo"}</h3>
          <p>{studyLevel.trim() || "Niveau d'etudes a definir"}</p>
        </div>
      </div>
    </section>
  );
}
