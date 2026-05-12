"use client";

type DangerZoneProps = {
  onAskDelete: () => void;
};

export function DangerZone({ onAskDelete }: DangerZoneProps) {
  return (
    <section className="danger-zone-card" aria-labelledby="danger-zone-title">
      <h2 id="danger-zone-title">Zone sensible</h2>
      <p>
        La suppression du compte est definitive. En version 1, cette action est volontairement bloquee pour eviter toute suppression accidentelle.
      </p>
      <button className="btn settings-btn-danger" type="button" onClick={onAskDelete}>
        Supprimer mon compte
      </button>
    </section>
  );
}
