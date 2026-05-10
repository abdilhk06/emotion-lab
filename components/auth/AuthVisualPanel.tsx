export function AuthVisualPanel() {
  return (
    <aside className="auth-visual">
      <div className="logo">
        <span aria-label="Emotion Lab" className="brand-logo brand-logo-sm logo-img" role="img" />
        <span>Emotion Lab</span>
      </div>
      <div className="auth-hero">
        <h2>
          Te revoir.
          <br />
          Continuer ensemble.
        </h2>
        <p>
          Reprends la ou tu t&apos;etais arrete·e - tes resultats, tes Buddies et tes conversations
          sont sauvegardes.
        </p>
      </div>
      <div className="auth-testimonial">
        La regularite, c&apos;est ce qui change tout. Bienvenue a nouveau.
        <div style={{ marginTop: "10px", fontWeight: 600, fontSize: "13px" }}>- L&apos;equipe Emotion Lab</div>
      </div>
    </aside>
  );
}
