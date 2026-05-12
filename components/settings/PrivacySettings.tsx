"use client";

type PrivacySettingsProps = {
  isVisible: boolean;
  onVisibilityChange: (value: boolean) => void;
  saving: boolean;
};

export function PrivacySettings({ isVisible, onVisibilityChange, saving }: PrivacySettingsProps) {
  return (
    <section className="settings-card">
      <div className="settings-card-head">
        <h2>Confidentialite</h2>
      </div>

      <div className="settings-row">
        <div>
          <h3>Profil visible dans l&apos;annuaire</h3>
          <p>Seuls les autres etudiant(e)s peuvent te voir.</p>
        </div>
        <label className="switch" aria-label="Visibilite du profil">
          <input type="checkbox" checked={isVisible} onChange={(event) => onVisibilityChange(event.target.checked)} disabled={saving} />
          <span className="slider" />
        </label>
      </div>

      <div className="settings-row">
        <div>
          <h3>Telecharger mes donnees</h3>
          <p>Export CNDP a venir dans une prochaine version.</p>
        </div>
        <button className="btn btn-tertiary settings-btn-sm" type="button" disabled>
          Bientot
        </button>
      </div>

      <div className="settings-row">
        <div>
          <h3>Politique de confidentialite</h3>
          <p>Consulte notre engagement sur tes donnees.</p>
        </div>
        <a className="btn btn-tertiary settings-btn-sm" href="/resources">
          Lire
        </a>
      </div>
    </section>
  );
}
