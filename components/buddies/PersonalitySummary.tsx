"use client";

type PersonalitySummaryProps = {
  mbtiCode: string | null;
  mbtiName: string | null;
  studyLevel: string;
};

export function PersonalitySummary({ mbtiCode, mbtiName, studyLevel }: PersonalitySummaryProps) {
  return (
    <section className="buddy-section">
      <h3 className="buddy-section-title">Son profil</h3>
      <div className="buddy-personality-card">
        <div className="buddy-info-row">
          <span aria-hidden="true" />
          <span className="buddy-info-label">Profil MBTI</span>
          <span className="buddy-info-value">{mbtiCode ? `${mbtiCode}${mbtiName ? ` - ${mbtiName}` : ""}` : "Non disponible"}</span>
        </div>
        <div className="buddy-info-row">
          <span aria-hidden="true" />
          <span className="buddy-info-label">Niveau</span>
          <span className="buddy-info-value plain">{studyLevel}</span>
        </div>
      </div>
    </section>
  );
}
