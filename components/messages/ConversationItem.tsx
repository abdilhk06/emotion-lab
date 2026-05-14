"use client";

import Link from "next/link";

type ConversationItemProps = {
  conversationId: string;
  pseudo: string;
  preview: string;
  timeLabel: string;
  initials: string;
  unreadCount: number;
};

export function ConversationItem({
  conversationId,
  pseudo,
  preview,
  timeLabel,
  initials,
  unreadCount,
}: ConversationItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <Link href={`/messages/${conversationId}`} className="conv-row">
      <div className="conv-avatar" aria-hidden="true">{initials}</div>
      <div className="conv-body">
        <span className="conv-handle">{pseudo}</span>
        <p className="conv-preview">{preview}</p>
      </div>
      <div className="conv-right">
        <span className="conv-time">{timeLabel}</span>
        {hasUnread ? <span className="unread-badge">{unreadCount}</span> : null}
      </div>
    </Link>
  );
}
