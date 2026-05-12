"use client";

type HobbiesEditorProps = {
  hobbies: string[];
  draftValue: string;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (hobby: string) => void;
};

export function HobbiesEditor({ hobbies, draftValue, onDraftChange, onAdd, onRemove }: HobbiesEditorProps) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <h3>Tes loisirs</h3>
        <span className="char-count">{hobbies.length} selectionne(s)</span>
      </div>
      <p className="profile-helper">Ajoute des loisirs un par un, puis retire ceux que tu ne veux plus afficher.</p>

      <div className="hobbies-input-row">
        <input
          type="text"
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Ex: Lecture, Running, Cuisine"
          maxLength={40}
        />
        <button type="button" className="btn btn-tertiary" onClick={onAdd}>
          Ajouter
        </button>
      </div>

      {hobbies.length === 0 ? (
        <p className="profile-helper profile-helper-muted">Aucun loisir pour le moment.</p>
      ) : (
        <div className="hobbies-chip-grid">
          {hobbies.map((hobby) => (
            <button key={hobby} type="button" className="hobby-chip" onClick={() => onRemove(hobby)}>
              {hobby} <span aria-hidden>x</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
