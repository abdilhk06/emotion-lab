"use client";

type PersonalitySummaryProps = {
  mbtiCode: string | null;
  mbtiName: string | null;
};

export function PersonalitySummary({ mbtiCode, mbtiName }: PersonalitySummaryProps) {
  return (
    <section className="buddy-section">
      <h3 className="buddy-section-title">Son profil</h3>
      <div className="buddy-personality-card">
        <div className="buddy-info-row">
          <span className="buddy-info-label">Profil MBTI</span>
          <span className="buddy-info-value">{mbtiCode ? `${mbtiCode}${mbtiName ? ` - ${mbtiName}` : ""}` : "Non disponible"}</span>
        </div>
      </div>
    </section>
  );
}
