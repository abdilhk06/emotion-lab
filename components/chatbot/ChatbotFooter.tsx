"use client";

type ChatbotFooterProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatbotFooter({ value, onChange, onSend, disabled }: ChatbotFooterProps) {
  return (
    <footer className="chatbot-footer">
      <label className="chatbot-input-label" htmlFor="chatbot-input">
        Ton message
      </label>
      <div className="chatbot-input-wrap">
        <input
          id="chatbot-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ecris ce que tu ressens"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSend();
            }
          }}
        />
        <button type="button" className="btn btn-primary" onClick={onSend} disabled={disabled}>
          Envoyer
        </button>
      </div>
      <style jsx>{`
        .chatbot-footer {
          display: grid;
          gap: 8px;
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 16px;
          padding: 12px;
        }

        .chatbot-input-label {
          font-size: 13px;
          color: var(--texte-clair);
          font-weight: 600;
        }

        .chatbot-input-wrap {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr auto;
        }

        input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--bordure);
          padding: 0 14px;
          font: inherit;
        }

        button {
          min-width: 120px;
          height: 44px;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .chatbot-input-wrap {
            grid-template-columns: 1fr;
          }

          button {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </footer>
  );
}
