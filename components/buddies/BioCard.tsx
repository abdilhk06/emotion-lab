"use client";

type BioCardProps = {
  title: string;
  content: string | null;
  fallback: string;
};

export function BioCard({ title, content, fallback }: BioCardProps) {
  return (
    <section className="buddy-section">
      <h3 className="buddy-section-title">{title}</h3>
      <article className="buddy-bio-card">
        <p>{content?.trim() ? content.trim() : fallback}</p>
      </article>
    </section>
  );
}
