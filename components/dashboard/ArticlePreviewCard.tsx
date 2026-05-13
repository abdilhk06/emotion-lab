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
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M18.5 15.2A7.3 7.3 0 0 1 8.8 5.5 7.5 7.5 0 1 0 18.5 15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
          border-radius: 15px;
          padding: 38px 22px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 154px;
          box-shadow: 0 10px 25px rgba(35, 28, 51, 0.06);
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .article-preview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(37, 34, 54, 0.1);
        }

        .thumb {
          width: 72px;
          height: 72px;
          flex: 0 0 72px;
          border-radius: 12px;
          background: linear-gradient(135deg, #e6a7b2, #a7cfd8);
          color: var(--plum);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .category {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--plum);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
        }

        h3 {
          margin: 0 0 6px;
          color: var(--texte);
          font-size: 15px;
        }

        .meta {
          margin: 0;
          color: #6b7890;
          font-size: 13px;
        }
      `}</style>
    </Link>
  );
}
