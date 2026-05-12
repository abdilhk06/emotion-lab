"use client";

type AvatarUploaderProps = {
  initials: string;
  pseudo: string;
};

export function AvatarUploader({ initials, pseudo }: AvatarUploaderProps) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <h3>Photo de profil</h3>
      </div>
      <div className="avatar-uploader">
        <div className="avatar avatar-xl avatar-strong" aria-label={`Initiales de ${pseudo || "l'utilisateur"}`}>
          {initials}
        </div>
        <div>
          <p className="profile-helper">Version v1: avatar avec initiales uniquement.</p>
          <p className="profile-helper profile-helper-muted">Le televersement Supabase Storage sera ajoute dans une prochaine version.</p>
        </div>
      </div>
    </section>
  );
}
