export function ResultsHero({
  mbtiCode,
  mbtiName,
  explanation,
  dateLabel,
  eyebrow = "Ton profil est pret",
  ctaLabel,
  compact = false,
}: {
  mbtiCode: string;
  mbtiName: string;
  explanation?: string;
  dateLabel?: string;
  eyebrow?: string;
  ctaLabel?: string;
  compact?: boolean;
}) {
  return (
    <section className={`results-hero ${compact ? "compact" : ""}`}>
      {!compact ? <span className="eyebrow">{eyebrow}</span> : null}
      <div className="results-hero-head">
        <div>
          <div className="results-code">{mbtiCode}</div>
          <div className="results-name">{mbtiName}</div>
          {dateLabel ? <p className="results-date">{dateLabel}</p> : null}
          {explanation ? <p className="results-tagline">{explanation}</p> : null}
        </div>
        {ctaLabel ? (
          <button className="results-share" type="button">
            {ctaLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
