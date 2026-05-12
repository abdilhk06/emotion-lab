"use client";

type LookingForEditorProps = {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
};

export function LookingForEditor({ value, maxLength, onChange }: LookingForEditorProps) {
  return (
    <section className="profile-card">
      <div className="profile-card-head">
        <h3>Ce que tu cherches</h3>
        <span className="char-count">
          {value.length} / {maxLength}
        </span>
      </div>
      <p className="profile-helper">Resume ton attente cote Buddy.</p>
      <textarea
        className="profile-textarea profile-textarea-sm"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ex: Un ou une partenaire motive(e), bienveillant(e), dispo le matin."
      />
    </section>
  );
}
