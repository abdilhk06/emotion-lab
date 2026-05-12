"use client";

export function ChatbotHeader() {
  return (
    <header className="chatbot-header" aria-label="En-tete du chatbot">
      <div className="chatbot-avatar" aria-hidden="true">
        <span className="brand-logo" />
      </div>
      <div>
        <h2>Emotion Bot</h2>
        <p>Assistant de bien-etre a reponses predefinies</p>
      </div>
      <style jsx>{`
        .chatbot-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          background:
            radial-gradient(120% 120% at 10% 0%, rgba(247, 186, 193, 0.35), transparent 60%),
            radial-gradient(120% 120% at 90% 10%, rgba(142, 192, 201, 0.32), transparent 60%),
            #fff;
        }

        .chatbot-avatar {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff;
          border: 1px solid var(--bordure);
          flex-shrink: 0;
        }

        .chatbot-avatar :global(.brand-logo) {
          width: 22px;
          height: 22px;
          border-radius: 8px;
        }

        h2 {
          margin: 0;
          color: var(--plum);
          font-size: 20px;
        }

        p {
          margin: 2px 0 0;
          color: var(--texte-gris);
          font-size: 14px;
        }
      `}</style>
    </header>
  );
}
