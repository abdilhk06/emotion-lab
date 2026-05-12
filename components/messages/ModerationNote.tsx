"use client";

export function ModerationNote() {
  return (
    <aside className="moderation-note" role="note" aria-label="Rappel de moderation">
      <strong>Rappel securite:</strong> pas de harcelement ni de partage de donnees personnelles sensibles.
      En cas d&apos;urgence ou de danger, contacte immediatement les services d&apos;aide de ta region.

      <style jsx>{`
        .moderation-note {
          border: 1px solid #f3d3d8;
          background: #fff7f8;
          color: #7a3348;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.45;
        }
      `}</style>
    </aside>
  );
}
