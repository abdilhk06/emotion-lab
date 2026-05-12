"use client";

type MessageBubbleProps = {
  content: string;
  timeLabel: string;
  isMine: boolean;
};

export function MessageBubble({ content, timeLabel, isMine }: MessageBubbleProps) {
  return (
    <article className={`message-row ${isMine ? "mine" : "theirs"}`}>
      <div className="bubble-wrap">
        <p className="bubble">{content}</p>
        <time className="time">{timeLabel}</time>
      </div>

      <style jsx>{`
        .message-row {
          display: flex;
        }

        .message-row.mine {
          justify-content: flex-end;
        }

        .message-row.theirs {
          justify-content: flex-start;
        }

        .bubble-wrap {
          max-width: min(78%, 520px);
          display: grid;
          gap: 4px;
        }

        .bubble {
          margin: 0;
          padding: 10px 12px;
          border-radius: 14px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .mine .bubble {
          background: linear-gradient(135deg, #6f3453 0%, #2e8bbf 100%);
          color: #fff;
          border-bottom-right-radius: 6px;
        }

        .theirs .bubble {
          border: 1px solid var(--bordure);
          background: #fff;
          color: var(--texte);
          border-bottom-left-radius: 6px;
        }

        .time {
          color: var(--texte-clair);
          font-size: 12px;
          padding: 0 4px;
        }

        .mine .time {
          text-align: right;
        }
      `}</style>
    </article>
  );
}
