"use client";

export function ModerationNote() {
  return (
    <aside className="moderation-note" role="note" aria-label="Rappel de moderation">
      Conversation moderee automatiquement pour ta securite

      <style jsx>{`
        .moderation-note {
          text-align: center;
          background: #f5f0f7;
          color: #64718b;
          padding: 10px 12px;
          font-size: 11px;
        }
      `}</style>
    </aside>
  );
}
