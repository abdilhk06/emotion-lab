"use client";

export function UrgentHelpBanner() {
  return (
    <section className="urgent-banner" role="note" aria-label="Aide urgente">
      <h2>Tu traverses une situation urgente ou dangereuse ?</h2>
      <p>
        Emotion Lab est un espace d&apos;accompagnement et <strong>ne remplace pas un professionnel de sante mentale</strong>. Si tu
        te sens en danger, appelle les services d&apos;urgence, un numero d&apos;aide local, ou contacte une personne de confiance des
        maintenant.
      </p>
      <style jsx>{`
        .urgent-banner {
          background: linear-gradient(140deg, #fff7f8 0%, #eef6ff 100%);
          border: 1px solid #f0d6db;
          border-radius: 18px;
          padding: 18px;
        }

        h2 {
          margin: 0 0 8px;
          color: #7e3d5e;
          font-size: 20px;
        }

        p {
          margin: 0;
          color: var(--texte-gris);
          font-size: 15px;
        }
      `}</style>
    </section>
  );
}
