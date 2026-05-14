import type { BigFiveScores } from "@/lib/calculate-result";

const RADAR_LABELS = [
  { key: "openness", label: "Ouverture", angle: -90 },
  { key: "conscientiousness", label: "Consciencieux", angle: -18 },
  { key: "extraversion", label: "Extraversion", angle: 54 },
  { key: "agreeableness", label: "Agreabilite", angle: 126 },
  { key: "neuroticism", label: "Stabilite", angle: 198 },
] as const;

const FORCE_META: Array<{ key: keyof BigFiveScores; label: string; icon: string; text: string }> = [
  { key: "agreeableness", label: "Agreabilite", icon: "❤️", text: "Tu es empathique et cooperatif.ve. Les autres se confient facilement a toi." },
  { key: "extraversion", label: "Extraversion", icon: "⚡", text: "Tu tires de l'energie des interactions et du travail collectif." },
  { key: "openness", label: "Ouverture", icon: "🌱", text: "Tu restes curieux.se, ouvert.e aux idees nouvelles et aux perspectives variees." },
  { key: "conscientiousness", label: "Organisation", icon: "🗂️", text: "Tu sais poser un cadre clair et avancer avec regularite quand l'objectif est net." },
  { key: "neuroticism", label: "Sensibilite", icon: "🎯", text: "Tu captes vite les tensions et les signaux faibles autour de toi." },
];

function polarToCartesian(angle: number, radius: number) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: 180 + Math.cos(rad) * radius,
    y: 180 + Math.sin(rad) * radius,
  };
}

function pointsForRadius(radius: number) {
  return RADAR_LABELS.map((item) => polarToCartesian(item.angle, radius));
}

function polygonString(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function scorePoint(angle: number, score: number) {
  const radius = 34 + (score / 100) * 86;
  return polarToCartesian(angle, radius);
}

export function BigFiveRadar({
  scores,
  title = "Tes super-pouvoirs",
  description,
}: {
  scores: BigFiveScores;
  title?: string | null;
  description?: string;
}) {
  const scorePoints = RADAR_LABELS.map((item) => scorePoint(item.angle, scores[item.key]));
  const topForces = [...FORCE_META].sort((a, b) => scores[b.key] - scores[a.key]).slice(0, 3);

  return (
    <section className="results-section">
      {title ? <div className="results-section-title">{title}</div> : null}
      {description ? <p className="results-section-description">{description}</p> : null}
      <div className="big-five-grid">
        <div className="radar-card">
          <svg className="radar-svg" viewBox="-60 -30 480 420" role="img" aria-label="Radar Big Five">
            {[120, 86, 52].map((radius) => (
              <polygon className="radar-grid-line" fill="none" stroke="#ded7e5" strokeWidth="1.2" key={radius} points={polygonString(pointsForRadius(radius))} />
            ))}
            {RADAR_LABELS.map((item) => {
              const end = polarToCartesian(item.angle, 120);
              return <line key={`${item.key}-axis`} x1="180" y1="180" x2={end.x} y2={end.y} stroke="#eee8f2" strokeWidth="1" />;
            })}
            <polygon className="radar-polygon" fill="rgba(126, 61, 94, 0.18)" stroke="#8a3b65" strokeWidth="2.4" points={polygonString(scorePoints)} />
            {scorePoints.map((point, index) => (
              <circle key={RADAR_LABELS[index].key} cx={point.x} cy={point.y} r="4" fill="#7E3D5E" />
            ))}
            {RADAR_LABELS.map((item) => {
              const labelPoint = polarToCartesian(item.angle, 148);
              const anchor = item.angle > 90 || item.angle < -90 ? "end" : item.angle === -90 ? "middle" : "start";
              return (
                <text className="radar-label" key={item.key} fill="#46536d" fontSize="12" fontWeight="700" textAnchor={anchor} dominantBaseline="middle" x={labelPoint.x} y={labelPoint.y}>
                  {item.label}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="forces-card">
          <h3>Ce qui te caracterise</h3>
          {topForces.map((force) => (
            <div className="force-item" key={force.key}>
              <div className="force-icon">{force.icon}</div>
              <div className="force-content">
                <h4>{force.label} : {scores[force.key]}/100</h4>
                <p>{force.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


