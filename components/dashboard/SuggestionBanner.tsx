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
        💡
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
          border-radius: 18px;
          border: 1px solid #f0dfcf;
          background: linear-gradient(135deg, #fff9ef, #fff3e7);
          padding: 16px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: flex-start;
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        h3 {
          margin: 0 0 6px;
          color: #654048;
        }

        p {
          margin: 0 0 14px;
          color: var(--texte-gris);
        }
      `}</style>
    </section>
  );
}
