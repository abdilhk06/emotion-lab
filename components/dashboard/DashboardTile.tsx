import Link from "next/link";

type DashboardTileProps = {
  title: string;
  value: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
  variant?: "profile" | "buddies" | "messages";
};

export function DashboardTile({ title, value, subtitle, ctaLabel, href, variant = "messages" }: DashboardTileProps) {
  const cardContent = (
    <>
      {variant === "buddies" ? (
        <div className="buddy-avatars" aria-label="Buddies actifs">
          {["S", "Y", "L"].map((initial) => (
            <span key={initial}>{initial}</span>
          ))}
        </div>
      ) : null}
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
    <Link className={`dashboard-tile dashboard-tile-link dashboard-tile-${variant}`} href={href}>
      {cardContent}
      <style jsx>{`
        .dashboard-tile {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 15px;
          padding: 22px;
          display: grid;
          align-content: start;
          gap: 7px;
          min-height: 202px;
          text-decoration: none;
          box-shadow: 0 10px 25px rgba(35, 28, 51, 0.06);
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }

        .dashboard-tile-profile {
          background: var(--gradient-signature);
          border-color: transparent;
          color: #fff;
        }

        .dashboard-tile-link:hover {
          transform: translateY(-2px);
          border-color: #d9d1e2;
          box-shadow: 0 12px 22px rgba(37, 34, 54, 0.08);
        }

        h3 {
          margin: 0;
          font-size: 15px;
          color: #263752;
          font-weight: 700;
        }

        .dashboard-tile-profile h3 {
          color: rgba(255, 255, 255, 0.9);
        }

        .value {
          margin: 0;
          font-family: "Poppins", sans-serif;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 700;
          color: var(--plum);
        }

        .dashboard-tile-profile .value {
          color: #fff;
          font-size: 38px;
          letter-spacing: 0;
          margin-top: 6px;
        }

        .dashboard-tile-buddies .value {
          font-size: 24px;
        }

        .subtitle {
          margin: 0;
          color: #243653;
          font-size: 14px;
        }

        .dashboard-tile-profile .subtitle {
          color: rgba(255, 255, 255, 0.82);
        }

        .cta {
          color: #0876bd;
          font-weight: 600;
          font-size: 14px;
          margin-top: 8px;
        }

        .dashboard-tile-profile .cta {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .buddy-avatars {
          display: flex;
          margin-bottom: 4px;
        }

        .buddy-avatars span {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          background: var(--gradient-signature);
          box-shadow: 0 0 0 2px #fff;
        }

        .buddy-avatars span + span {
          margin-left: -8px;
        }
      `}</style>
    </Link>
  );
}
