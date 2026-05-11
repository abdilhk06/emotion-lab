import Link from "next/link";

type ArticlePreviewCardProps = {
  category: string;
  title: string;
  meta: string;
  href: string;
};

export function ArticlePreviewCard({ category, title, meta, href }: ArticlePreviewCardProps) {
  return (
    <Link className="article-preview-card" href={href}>
      <div className="thumb" aria-hidden="true">
        🌙
      </div>
      <div>
        <p className="category">{category}</p>
        <h3>{title}</h3>
        <p className="meta">{meta}</p>
      </div>
      <style jsx>{`
        .article-preview-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 18px;
          text-decoration: none;
          display: grid;
          grid-template-columns: 52px 1fr;
          align-items: start;
          gap: 12px;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .article-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 34, 54, 0.1);
        }

        .thumb {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #eef7fb;
          color: #1d698d;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .category {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--texte-clair);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        h3 {
          margin: 0 0 6px;
          color: var(--texte);
        }

        .meta {
          margin: 0;
          color: var(--texte-gris);
          font-size: 13px;
        }
      `}</style>
    </Link>
  );
}
