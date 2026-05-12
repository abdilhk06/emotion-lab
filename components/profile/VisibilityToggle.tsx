"use client";

type VisibilityToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function VisibilityToggle({ checked, onChange }: VisibilityToggleProps) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <h3>Visibilite dans l&apos;annuaire</h3>
      </div>
      <div className="visibility-toggle">
        <div>
          <h4>Profil visible aux autres etudiant(e)s</h4>
          <p>
            En desactivant, tu ne recevras plus de demandes et ton profil n&apos;apparaitra plus dans l&apos;annuaire.
          </p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <span className="slider" />
        </label>
      </div>
    </section>
  );
}
