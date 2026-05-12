"use client";

import { MessageBubble } from "@/components/messages/MessageBubble";

type MessageItem = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type MessagesListProps = {
  messages: MessageItem[];
  currentUserId: string;
};

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function MessagesList({ messages, currentUserId }: MessagesListProps) {
  if (messages.length === 0) {
    return (
      <section className="state-card" role="status">
        <h3>Aucun message pour l&apos;instant</h3>
        <p>Lance la conversation avec ton buddy en envoyant le premier message.</p>

        <style jsx>{`
          .state-card {
            background: #fff;
            border: 1px solid var(--bordure);
            border-radius: 14px;
            padding: 16px;
          }

          .state-card h3 {
            margin: 0 0 8px;
            font-size: 18px;
          }

          .state-card p {
            margin: 0;
            color: var(--texte-gris);
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="messages-list" aria-label="Messages de la conversation">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          content={message.content}
          timeLabel={formatMessageTime(message.createdAt)}
          isMine={message.senderId === currentUserId}
        />
      ))}

      <style jsx>{`
        .messages-list {
          display: grid;
          gap: 10px;
          max-height: 62vh;
          overflow-y: auto;
          padding: 4px;
        }
      `}</style>
    </section>
  );
}
