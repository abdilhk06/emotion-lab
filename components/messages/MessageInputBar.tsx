"use client";

import { FormEvent, useState } from "react";

type MessageInputBarProps = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};

export function MessageInputBar({ onSend, disabled = false }: MessageInputBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    await onSend(trimmed);
    setValue("");
  };

  return (
    <form className="input-bar" onSubmit={(event) => void handleSubmit(event)}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ecris ton message..."
        disabled={disabled}
        maxLength={1000}
      />
      <button type="submit" disabled={disabled || value.trim().length === 0}>
        Envoyer
      </button>

      <style jsx>{`
        .input-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          border: 1px solid var(--bordure);
          background: #fff;
          border-radius: 14px;
          padding: 10px;
        }

        input {
          min-width: 0;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--bordure);
          padding: 0 12px;
          font: inherit;
        }

        button {
          height: 42px;
          border-radius: 10px;
          border: none;
          background: var(--plum);
          color: #fff;
          font-weight: 600;
          padding: 0 14px;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
