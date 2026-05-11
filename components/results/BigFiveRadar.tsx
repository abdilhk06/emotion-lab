import type { BigFiveScores } from "@/lib/calculate-result";

const RADAR_LABELS = [
  { key: "openness", label: "Ouverture", angle: -90 },
  { key: "conscientiousness", label: "Consciencieux", angle: -18 },
  { key: "extraversion", label: "Extraversion", angle: 54 },
  { key: "agreeableness", label: "Agreabilite", angle: 126 },
  { key: "neuroticism", label: "Stabilite", angle: 198 },
] as const;

const FORCE_META: Array<{ key: keyof BigFiveScores; icon: string; text: string }> = [
  { key: "agreeableness", icon: "AG", text: "Tu es empathique et cooperatif.ve. Les autres se confient facilement a toi." },
  { key: "extraversion", icon: "EX", text: "Tu tires de l'energie des interactions et du travail collectif." },
  { key: "openness", icon: "OU", text: "Tu restes curieux.se, ouvert.e aux idees nouvelles et aux perspectives variees." },
];

function polarToCartesian(angle: number, radius: number) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: 150 + Math.cos(rad) * radius,
    y: 150 + Math.sin(rad) * radius,
  };
}

function pointsForRadius(radius: number) {
  return RADAR_LABELS.map((item) => polarToCartesian(item.angle, radius));
}

function polygonString(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function scorePoint(angle: number, score: number) {
  const radius = 35 + (score / 100) * 95;
  return polarToCartesian(angle, radius);
}

export function BigFiveRadar({ scores }: { scores: BigFiveScores }) {
  const scorePoints = RADAR_LABELS.map((item) => scorePoint(item.angle, scores[item.key]));
  const topForces = [...FORCE_META].sort((a, b) => scores[b.key] - scores[a.key]).slice(0, 3);

  return (
    <section className="results-section">
      <div className="results-section-title">Tes super-pouvoirs</div>
      <div className="big-five-grid">
        <div className="radar-card">
          <svg className="radar-svg" viewBox="0 0 300 300" role="img" aria-label="Radar Big Five">
            {[125, 90, 55].map((radius) => (
              <polygon className="radar-grid-line" key={radius} points={polygonString(pointsForRadius(radius))} />
            ))}
            <polygon className="radar-polygon" points={polygonString(scorePoints)} />
            {scorePoints.map((point, index) => (
              <circle key={RADAR_LABELS[index].key} cx={point.x} cy={point.y} r="4" fill="#7E3D5E" />
            ))}
            {RADAR_LABELS.map((item) => {
              const labelPoint = polarToCartesian(item.angle, 138);
              const anchor = item.angle > 90 || item.angle < -90 ? "end" : item.angle === -90 ? "middle" : "start";
              return (
                <text className="radar-label" key={item.key} textAnchor={anchor} x={labelPoint.x} y={labelPoint.y}>
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
                <h4>{force.key === "agreeableness" ? "Agreabilite" : force.key === "extraversion" ? "Extraversion" : "Ouverture"} : {scores[force.key]}/100</h4>
                <p>{force.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


