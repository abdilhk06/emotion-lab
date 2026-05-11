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
  description,
  tone,
  scale,
}: {
  label: string;
  value: number;
  status: string;
  description: string;
  tone: GaugeTone;
  scale: [string, string, string];
}) {
  return (
    <article className="gauge-card">
      <div className="gauge-label">{label}</div>
      <div className={`gauge-value gauge-value-${toneClass[tone]}`}>
        {value}
        <span> / 100</span>
      </div>
      <div className={`gauge-status ${toneClass[tone]}`}>● {status}</div>
      <div className="gauge-track">
        <div className={`gauge-fill ${toneClass[tone]}`} style={{ width: `${value}%` }} />
      </div>
      <div className="gauge-scale">
        <span>{scale[0]}</span>
        <span>{scale[1]}</span>
        <span>{scale[2]}</span>
      </div>
      <p>{description}</p>
    </article>
  );
}
