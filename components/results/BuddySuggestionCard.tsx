export type BuddySuggestion = {
  id: string;
  handle: string;
  initials: string;
  mbti: string;
  level: string;
  tagline: string;
  interests: string[];
  compatibility: number;
};

export function BuddySuggestionCard({ buddy }: { buddy: BuddySuggestion }) {
  return (
    <article className="buddy-card card-hover">
      <span className="buddy-compat">{buddy.compatibility}%</span>
      <div className="buddy-header">
        <div className="buddy-avatar">{buddy.initials}</div>
        <div className="buddy-info">
          <h4>{buddy.handle}</h4>
          <div className="buddy-meta">{buddy.mbti} · {buddy.level}</div>
        </div>
      </div>
      <p className="buddy-tagline">{buddy.tagline}</p>
      <div className="buddy-common">
        {buddy.interests.length > 0 ? (
          buddy.interests.map((interest) => (
            <span className="chip" key={`${buddy.id}-${interest}`}>{interest}</span>
          ))
        ) : (
          <span className="chip chip-muted">Aucun hobby commun</span>
        )}
      </div>
      <div className="buddy-action">
        <button className="btn btn-primary" type="button">Envoyer une demande</button>
      </div>
    </article>
  );
}
