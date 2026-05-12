"use client";

type QuickRepliesProps = {
  options: readonly string[];
  onSelect: (value: string) => void;
};

export function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  return (
    <section className="quick-replies" aria-label="Reponses rapides">
      {options.map((option) => (
        <button key={option} className="quick-reply" type="button" onClick={() => onSelect(option)}>
          {option}
        </button>
      ))}
      <style jsx>{`
        .quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .quick-reply {
          border: 1px solid #dbcde8;
          border-radius: 999px;
          padding: 10px 14px;
          background: #fff;
          color: var(--plum);
          font-weight: 600;
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
        }

        .quick-reply:hover {
          background: #f6eff9;
          border-color: #ccb7de;
          transform: translateY(-1px);
        }
      `}</style>
    </section>
  );
}
