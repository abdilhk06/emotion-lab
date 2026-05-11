export function ResultsHero({
  mbtiCode,
  mbtiName,
  explanation,
}: {
  mbtiCode: string;
  mbtiName: string;
  explanation: string;
}) {
  return (
    <section className="results-hero">
      <span className="eyebrow">Ton profil est pret</span>
      <div className="results-code">{mbtiCode}</div>
      <div className="results-name">{mbtiName}</div>
      <p className="results-tagline">{explanation}</p>
      <button className="results-share" type="button">Partager mon profil</button>
    </section>
  );
}
