import Link from "next/link";

type DashboardTileProps = {
  title: string;
  value: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
};

export function DashboardTile({ title, value, subtitle, ctaLabel, href }: DashboardTileProps) {
  const cardContent = (
    <>
      <h3>{title}</h3>
      <p className="value">{value}</p>
      <p className="subtitle">{subtitle}</p>
      <span className="cta">{ctaLabel} {"->"}</span>
    </>
  );

  if (!href) {
    return <article className="dashboard-tile">{cardContent}</article>;
  }

  return (
    <Link className="dashboard-tile dashboard-tile-link" href={href}>
      {cardContent}
      <style jsx>{`
        .dashboard-tile {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
          display: grid;
          gap: 8px;
          text-decoration: none;
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }

        .dashboard-tile-link:hover {
          transform: translateY(-2px);
          border-color: #d9d1e2;
          box-shadow: 0 12px 22px rgba(37, 34, 54, 0.08);
        }

        h3 {
          margin: 0;
          font-size: 17px;
          color: var(--texte);
        }

        .value {
          margin: 0;
          font-family: "Poppins", sans-serif;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 700;
          color: var(--plum);
        }

        .subtitle {
          margin: 0;
          color: var(--texte-gris);
        }

        .cta {
          color: var(--bleu-ciel);
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>
    </Link>
  );
}
