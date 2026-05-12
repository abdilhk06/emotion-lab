"use client";

import Link from "next/link";

type ConversationItemProps = {
  conversationId: string;
  pseudo: string;
  preview: string;
  timeLabel: string;
  initials: string;
  unreadCount: number;
};

export function ConversationItem({
  conversationId,
  pseudo,
  preview,
  timeLabel,
  initials,
  unreadCount,
}: ConversationItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <article className={`conversation-item ${hasUnread ? "unread" : ""}`}>
      <Link className="conversation-link" href={`/messages/${conversationId}`}>
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="content">
          <header className="content-header">
            <p className={`pseudo ${hasUnread ? "is-unread" : ""}`}>{pseudo}</p>
            <time className="time">{timeLabel}</time>
          </header>

          <div className="content-footer">
            <p className={`preview ${hasUnread ? "is-unread" : ""}`}>{preview}</p>
            <span className="cta">Ouvrir</span>
          </div>
        </div>

        <div className="badge-wrap" aria-hidden="true">
          {hasUnread ? <span className="badge">{unreadCount}</span> : <span className="badge placeholder">0</span>}
        </div>
      </Link>

      <style jsx>{`
        .conversation-item {
          border: 1px solid var(--bordure);
          border-radius: 16px;
          background: #fff;
          overflow: hidden;
          box-shadow: 0 8px 26px rgba(126, 61, 94, 0.06);
        }

        .conversation-item.unread {
          border-color: #ead7f0;
          background: linear-gradient(180deg, #ffffff 0%, #fcf8ff 100%);
        }

        .conversation-link {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          color: inherit;
          text-decoration: none;
        }

        .conversation-link:hover {
          background: #fbf6fd;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          background: linear-gradient(135deg, var(--plum) 0%, #8a6889 42%, var(--bleu-ciel) 100%);
          flex-shrink: 0;
        }

        .content {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .pseudo {
          margin: 0;
          font-weight: 600;
          color: var(--texte);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pseudo.is-unread {
          color: var(--plum);
          font-weight: 700;
        }

        .time {
          color: var(--texte-clair);
          font-size: 12px;
          flex-shrink: 0;
        }

        .content-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .preview {
          margin: 0;
          color: var(--texte-gris);
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview.is-unread {
          color: #3f2a3c;
          font-weight: 500;
        }

        .cta {
          border: 1px solid #d5e7f0;
          background: #f3f9fc;
          color: #2f5d73;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          flex-shrink: 0;
        }

        .badge-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
        }

        .badge {
          min-width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f2adb2;
          color: #61253f;
          font-size: 12px;
          font-weight: 700;
          padding: 0 8px;
        }

        .badge.placeholder {
          background: #ece7f1;
          color: #8f8596;
          opacity: 0.7;
        }

        @media (max-width: 700px) {
          .conversation-link {
            grid-template-columns: auto 1fr;
          }

          .badge-wrap {
            display: none;
          }
        }
      `}</style>
    </article>
  );
}
