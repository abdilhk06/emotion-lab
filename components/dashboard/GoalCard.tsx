type GoalCardProps = {
  title: string;
  periodLabel: string;
  objective: string;
  progress: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function GoalCard({ title, periodLabel, objective, progress }: GoalCardProps) {
  const safeProgress = clamp(progress);

  return (
    <article className="goal-card">
      <div className="header">
        <h3>{title}</h3>
        <span className="tag">{periodLabel}</span>
      </div>
      <p className="objective">{objective}</p>
      <div className="track" role="progressbar" aria-valuenow={safeProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'objectif">
        <span className="fill" style={{ width: `${safeProgress}%` }} />
      </div>
      <div className="meta">
        <span>Progression</span>
        <span>{safeProgress}%</span>
      </div>
      <style jsx>{`
        .goal-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 15px;
          padding: 22px;
          min-height: 154px;
          box-shadow: 0 10px 25px rgba(35, 28, 51, 0.06);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        h3 {
          margin: 0;
          font-size: 20px;
        }

        .tag {
          background: #f5ecf4;
          color: var(--plum);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
        }

        .objective {
          margin: 20px 0 12px;
          color: var(--texte);
          font-size: 14px;
        }

        .track {
          height: 7px;
          border-radius: 999px;
          background: #ede7f2;
          overflow: hidden;
        }

        .fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #7e3d5e, #2e8bbf);
        }

        .meta {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          color: var(--texte-clair);
          font-size: 12px;
        }
      `}</style>
    </article>
  );
}
