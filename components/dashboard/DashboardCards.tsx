import Link from "next/link";

type DashboardCard = {
  title: string;
  value: string;
  description: string;
  href: string;
  cta: string;
};

export function DashboardCards({
  hasTestResult,
}: {
  hasTestResult: boolean;
}) {
  const cards: DashboardCard[] = [
    {
      title: "Personnalite",
      value: hasTestResult ? "Resultat disponible" : "Test non complete",
      description: hasTestResult
        ? "Consulte ton dernier resultat de test."
        : "Commence le test pour debloquer ton profil.",
      href: hasTestResult ? "/results" : "/test/intro",
      cta: hasTestResult ? "Voir mes resultats" : "Faire le test",
    },
    {
      title: "Buddies",
      value: "Annuaire",
      description: "Explore tes connexions et ajoute de nouveaux buddies.",
      href: "/buddies",
      cta: "Acceder aux buddies",
    },
    {
      title: "Messages",
      value: "Messagerie",
      description: "Consulte les derniers echanges avec tes contacts.",
      href: "/messages",
      cta: "Ouvrir la messagerie",
    },
    {
      title: "Ressources",
      value: "Bibliotheque",
      description: "Retrouve les outils utiles pour gerer tes emotions.",
      href: "/resources",
      cta: "Voir les ressources",
    },
  ];

  return (
    <>
      {!hasTestResult ? (
        <div className="dashboard-cta">
          <p>Tu n&apos;as pas encore de resultat de test de personnalite.</p>
          <Link className="btn btn-primary" href="/test/intro">
            Commencer le test
          </Link>
        </div>
      ) : null}

      <div className="dashboard-grid">
        {cards.map((card) => (
          <article className="dashboard-card" key={card.title}>
            <h2>{card.title}</h2>
            <p className="dashboard-card-value">{card.value}</p>
            <p>{card.description}</p>
            <Link className="dashboard-card-link" href={card.href}>
              {card.cta} {"->"}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
