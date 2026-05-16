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
      <button type="submit" aria-label="Envoyer le message" disabled={disabled || value.trim().length === 0}>
        →
      </button>

      <style jsx>{`
        .input-bar {
          display: flex;
          gap: 10px;
          align-items: center;
          border-top: 1px solid #e5e0ec;
          background: #fff;
          padding: 14px 20px;
        }

        input {
          min-width: 0;
          flex: 1;
          height: 44px;
          border-radius: 24px;
          border: 1px solid #e5e0ec;
          padding: 0 16px;
          font: inherit;
          font-size: 14px;
          outline: none;
        }

        button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #7e3d5e;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          flex: 0 0 auto;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
