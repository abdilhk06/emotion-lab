"use client";

type CompatibilityBadgeProps = {
  score: number;
  compact?: boolean;
};

function toneFromScore(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 65) return "mid";
  return "low";
}

export function CompatibilityBadge({ score, compact = false }: CompatibilityBadgeProps) {
  const tone = toneFromScore(score);

  return (
    <span className={`compatibility-badge ${tone} ${compact ? "compact" : ""}`.trim()}>
      {score}% de compatibilite{compact ? "" : " avec toi"}
    </span>
  );
}
