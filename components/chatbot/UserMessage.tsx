"use client";

export function UserMessage({ message }: { message: string }) {
  return (
    <article className="user-message">
      <p>{message}</p>
      <style jsx>{`
        .user-message {
          display: flex;
          justify-content: flex-end;
        }

        p {
          margin: 0;
          max-width: min(100%, 620px);
          padding: 12px 14px;
          border-radius: 14px 14px 4px 14px;
          background: #e6f1f8;
          border: 1px solid #cfe3f0;
          color: var(--texte);
          white-space: pre-wrap;
        }
      `}</style>
    </article>
  );
}
