import Link from "next/link";

type SuggestionBannerProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function SuggestionBanner({ title, description, ctaLabel, ctaHref }: SuggestionBannerProps) {
  return (
    <section className="suggestion-banner" aria-label="Suggestion du jour">
      <div className="icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M9 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.5 15.5c0-2-2.5-3.2-2.5-6a6 6 0 1 1 12 0c0 2.8-2.5 4-2.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="content">
        <h3>{title}</h3>
        <p>{description}</p>
        <Link className="btn btn-primary" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
      <style jsx>{`
        .suggestion-banner {
          border-radius: 16px;
          border: 0;
          background: #f7c5cf;
          padding: 24px 28px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: center;
        }

        .icon {
          width: 24px;
          height: 44px;
          color: var(--plum);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0 0 2px;
          color: var(--plum);
          font-size: 15px;
        }

        p {
          margin: 0 0 12px;
          color: #243653;
          font-size: 14px;
          line-height: 1.35;
        }

        .btn {
          min-height: 36px;
          padding: 9px 15px;
          border-radius: 11px;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}
