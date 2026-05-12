"use client";

import Link from "next/link";

type ConversationTopBarProps = {
  pseudo: string;
  studyLevel: string;
  initials: string;
};

export function ConversationTopBar({ pseudo, studyLevel, initials }: ConversationTopBarProps) {
  return (
    <header className="conversation-top-bar">
      <Link className="back-btn" href="/messages" aria-label="Retour a la messagerie">
        ←
      </Link>

      <div className="avatar" aria-hidden="true">
        {initials}
      </div>

      <div className="buddy-meta">
        <h2>{pseudo}</h2>
        <p>{studyLevel}</p>
      </div>

      <style jsx>{`
        .conversation-top-bar {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--bordure);
          background: #fff;
          border-radius: 14px;
          padding: 10px 12px;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--bordure);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--texte);
          text-decoration: none;
          font-size: 18px;
          background: #fff;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          background: linear-gradient(135deg, var(--plum) 0%, #8a6889 42%, var(--bleu-ciel) 100%);
        }

        .buddy-meta h2 {
          margin: 0;
          font-size: 16px;
          color: var(--texte);
        }

        .buddy-meta p {
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--texte-clair);
        }
      `}</style>
    </header>
  );
}
