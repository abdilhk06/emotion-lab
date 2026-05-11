"use client";

type SharedHobbiesProps = {
  buddyHobbies: string[];
  sharedHobbies: string[];
};

export function SharedHobbies({ buddyHobbies, sharedHobbies }: SharedHobbiesProps) {
  return (
    <section className="buddy-section">
      <h3 className="buddy-section-title">Ses loisirs</h3>
      {buddyHobbies.length > 0 ? (
        <div className="buddy-hobbies-list">
          {buddyHobbies.map((hobby) => (
            <span key={hobby} className={`buddy-hobby-chip ${sharedHobbies.includes(hobby) ? "shared" : "muted"}`}>
              {hobby}
            </span>
          ))}
        </div>
      ) : (
        <p className="buddy-muted">Aucun loisir renseigne pour le moment.</p>
      )}
      {sharedHobbies.length > 0 ? (
        <p className="buddy-shared-note">
          <strong>{sharedHobbies.length} loisir(s) en commun avec toi :</strong> {sharedHobbies.join(", ")}
        </p>
      ) : (
        <p className="buddy-muted">Aucun loisir en commun detecte pour le moment.</p>
      )}
    </section>
  );
}
