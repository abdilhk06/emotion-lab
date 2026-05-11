export function ResultsHero({
  mbtiCode,
  mbtiName,
  explanation,
  eyebrow = "Ton profil est pret",
  ctaLabel,
}: {
  mbtiCode: string;
  mbtiName: string;
  explanation: string;
  eyebrow?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="results-hero">
      <span className="eyebrow">{eyebrow}</span>
      <div className="results-code">{mbtiCode}</div>
      <div className="results-name">{mbtiName}</div>
      <p className="results-tagline">{explanation}</p>
      {ctaLabel ? (
        <button className="results-share" type="button">
          {ctaLabel}
        </button>
      ) : null}
    </section>
  );
}
