"use client";

type SecuritySettingsProps = {
  onLogout: () => Promise<void>;
  logoutLoading: boolean;
};

export function SecuritySettings({ onLogout, logoutLoading }: SecuritySettingsProps) {
  return (
    <section className="settings-card settings-card-softblue">
      <div className="settings-card-head">
        <h2>Securite</h2>
      </div>

      <div className="settings-row">
        <div>
          <h3>Session actuelle</h3>
          <p>Tu peux fermer ta session sur cet appareil.</p>
        </div>
        <button className="btn btn-tertiary settings-btn-sm" type="button" onClick={() => void onLogout()} disabled={logoutLoading}>
          {logoutLoading ? "Deconnexion..." : "Me deconnecter"}
        </button>
      </div>

      <div className="settings-row">
        <div>
          <h3>Mot de passe</h3>
          <p>Redirection vers le flux de changement de mot de passe en v1.1.</p>
        </div>
        <a className="settings-link" href="#" onClick={(event) => event.preventDefault()}>
          Changer mon mot de passe
        </a>
      </div>
    </section>
  );
}
