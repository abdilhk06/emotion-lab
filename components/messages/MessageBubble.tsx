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
          max-width: min(82vw, 430px);
          display: grid;
          gap: 5px;
        }

        .bubble {
          margin: 0;
          padding: 10px 15px;
          border-radius: 16px;
          white-space: pre-wrap;
          word-break: break-word;
          border: 1px solid #e5e0ec;
          background: #fff;
          font-size: 14px;
        }

        .mine .bubble {
          background: #7e3d5e;
          color: #fff;
          border-color: #7e3d5e;
          font-weight: 700;
        }

        .theirs .bubble {
          color: #071238;
        }

        .time {
          color: #64718b;
          font-size: 11px;
          padding: 0 6px;
        }

        .mine .time {
          text-align: right;
        }
      `}</style>
    </article>
  );
}
