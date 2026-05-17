import Link from "next/link";

export type Resource = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  category: string;
  type: string;
  duration: string;
  description: string;
  ctaLabel: string;
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const thumbClass = `resource-thumb ${
    resource.category === "Sommeil"
      ? "thumb-2"
      : resource.category === "Organisation"
        ? "thumb-3"
        : resource.category === "Examens"
          ? "thumb-4"
          : ""
  }`;

  return (
    <article className="resource-card card">
      <div className={thumbClass} aria-hidden="true">
        <span>{resource.icon}</span>
      </div>
      <div className="resource-body">
        <p className="resource-category">{resource.category}</p>
        <h3>{resource.title}</h3>
        <p className="resource-meta">
          <span>{resource.duration}</span>
        </p>
        <Link className="resource-cta" href={`/resources/${resource.slug}`}>
          {resource.ctaLabel} →
        </Link>
      </div>
      <style jsx>{`
        .resource-card {
          cursor: pointer;
          overflow: hidden;
          padding: 0;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .resource-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(26, 26, 46, 0.1);
        }

        .resource-thumb {
          height: 120px;
          background: linear-gradient(135deg, var(--rose-pale), var(--bleu-pale));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
        }

        .resource-thumb span {
          line-height: 1;
        }

        .resource-thumb.thumb-2 {
          background: linear-gradient(135deg, var(--bleu-pale), #8a6889);
        }

        .resource-thumb.thumb-3 {
          background: linear-gradient(135deg, #8a6889, var(--plum));
        }

        .resource-thumb.thumb-4 {
          background: linear-gradient(135deg, #f2adb2, var(--rose-pale));
        }

        .resource-body {
          padding: 18px;
        }

        .resource-body h3 {
          margin: 0 0 8px;
          font-size: 16px;
          color: var(--texte);
          line-height: 1.3;
        }

        .resource-category {
          margin: 0 0 6px;
          color: var(--plum);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .resource-meta {
          margin: 0 0 10px;
          color: var(--texte-clair);
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .resource-cta {
          color: var(--bleu-ciel);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
        }

        .resource-cta:hover {
          text-decoration: underline;
        }
      `}</style>
    </article>
  );
}
