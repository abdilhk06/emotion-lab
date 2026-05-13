export type GaugeTone = "low" | "moderate" | "high" | "balanced";

const toneClass: Record<GaugeTone, string> = {
  low: "faible",
  moderate: "modere",
  high: "eleve",
  balanced: "equilibre",
};

export function GaugeCard({
  label,
  value,
  status,
  chipLabel,
  description,
  tone,
  scale,
  compact = false,
  hideTrack = false,
}: {
  label: string;
  value: number;
  status: string;
  chipLabel?: string;
  description: string;
  tone: GaugeTone;
  scale: [string, string, string];
  compact?: boolean;
  hideTrack?: boolean;
}) {
  return (
    <article className={`gauge-card ${compact ? "gauge-card-compact" : ""}`}>
      <div className="gauge-label">{label}</div>
      <div className="gauge-main">
        <div className={`gauge-value gauge-value-${toneClass[tone]}`}>
          {value}
          <span>/100</span>
        </div>
        {compact ? <span className={`gauge-chip ${toneClass[tone]}`}>{chipLabel ?? status}</span> : null}
      </div>
      {!compact ? <div className={`gauge-status ${toneClass[tone]}`}>● {status}</div> : null}
      {!hideTrack ? (
        <>
          <div className="gauge-track">
            <div className={`gauge-fill ${toneClass[tone]}`} style={{ width: `${value}%` }} />
          </div>
          <div className="gauge-scale">
            <span>{scale[0]}</span>
            <span>{scale[1]}</span>
            <span>{scale[2]}</span>
          </div>
        </>
      ) : null}
      <p>{description}</p>
    </article>
  );
}
