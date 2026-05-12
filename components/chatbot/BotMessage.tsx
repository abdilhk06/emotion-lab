"use client";

export function BotMessage({ message }: { message: string }) {
  return (
    <article className="bot-message">
      <div className="bot-icon" aria-hidden="true">
        <span className="brand-logo" />
      </div>
      <p>{message}</p>
      <style jsx>{`
        .bot-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          max-width: 100%;
        }

        .bot-icon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          border: 1px solid var(--bordure);
          display: grid;
          place-items: center;
          background: #fff;
          flex-shrink: 0;
        }

        .bot-icon :global(.brand-logo) {
          width: 14px;
          height: 14px;
          border-radius: 6px;
        }

        p {
          margin: 0;
          max-width: min(100%, 640px);
          padding: 12px 14px;
          border-radius: 14px 14px 14px 4px;
          background: #f2eef8;
          border: 1px solid #e4d8ee;
          color: var(--texte);
          white-space: pre-wrap;
        }
      `}</style>
    </article>
  );
}
