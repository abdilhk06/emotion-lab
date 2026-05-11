import Link from "next/link";

export type Resource = {
  id: string;
  icon: string;
  title: string;
  category: string;
  type: string;
  duration: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <article className="resource-card">
      <div className="resource-icon" aria-hidden="true">
        {resource.icon}
      </div>
      <div className="resource-body">
        <p className="resource-category">{resource.category}</p>
        <h3>{resource.title}</h3>
        <p className="resource-description">{resource.description}</p>
        <p className="resource-meta">
          <span>{resource.type}</span>
          <span aria-hidden="true">•</span>
          <span>{resource.duration}</span>
        </p>
        <Link className="resource-cta" href={resource.href}>
          {resource.ctaLabel}
        </Link>
      </div>
      <style jsx>{`
        .resource-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          padding: 18px;
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 14px;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }

        .resource-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(46, 34, 58, 0.1);
        }

        .resource-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          background: linear-gradient(160deg, #f6ebf4 0%, #e9f2fb 100%);
        }

        .resource-body h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: var(--texte);
        }

        .resource-category {
          margin: 0 0 6px;
          color: var(--plum);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .resource-description {
          margin: 0 0 10px;
          color: var(--texte-gris);
          font-size: 14px;
        }

        .resource-meta {
          margin: 0 0 12px;
          color: var(--texte-clair);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .resource-cta {
          color: var(--bleu-ciel);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .resource-cta:hover {
          text-decoration: underline;
        }
      `}</style>
    </article>
  );
}
