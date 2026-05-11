export type MBTIAxisItem = {
  leftLabel: string;
  rightLabel: string;
  activeSide: "left" | "right";
  value: number;
};

export function MBTIAxes({ axes }: { axes: MBTIAxisItem[] }) {
  return (
    <section className="results-section">
      <div className="results-section-title">Tes 4 dimensions</div>
      <div className="axes-grid">
        {axes.map((axis) => (
          <div className="axe-row" key={`${axis.leftLabel}-${axis.rightLabel}`}>
            <div className="axe-header">
              <span className={`axe-letter ${axis.activeSide === "left" ? "active" : ""}`}>{axis.leftLabel}</span>
              <span className={`axe-letter ${axis.activeSide === "right" ? "active" : ""}`}>{axis.rightLabel}</span>
            </div>
            <div className="axe-track">
              <div className="axe-fill" style={{ width: `${axis.value}%` }}>
                <div className="axe-dot" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
