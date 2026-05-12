"use client";

type AccountSettingsProps = {
  email: string;
};

export function AccountSettings({ email }: AccountSettingsProps) {
  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>Compte</h2>
      </div>

      <div className="settings-row">
        <div>
          <h3>Email</h3>
          <p>{email}</p>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <h3>Mot de passe</h3>
          <p>Derniere modification: non disponible pour le moment.</p>
        </div>
        <a className="btn btn-tertiary settings-btn-sm" href="#" aria-disabled="true" onClick={(event) => event.preventDefault()}>
          Changer (bientot)
        </a>
      </div>
    </section>
  );
}
