"use client";

type BioEditorProps = {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
};

export function BioEditor({ value, maxLength, onChange }: BioEditorProps) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <h3>Ta bio</h3>
        <span className="char-count">
          {value.length} / {maxLength}
        </span>
      </div>
      <p className="profile-helper">Raconte qui tu es en quelques mots. Cette bio sera visible sur ta fiche Buddy.</p>
      <textarea
        className="profile-textarea"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex: Etudiante en PM, j'aime bosser en binome et garder un bon rythme serein."
      />
    </section>
  );
}
