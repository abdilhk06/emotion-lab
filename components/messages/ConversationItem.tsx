"use client";

import Link from "next/link";
import { ProfileLink } from "@/components/ui/ProfileLink";

type ConversationItemProps = {
  conversationId: string;
  profileId: string;
  pseudo: string;
  preview: string;
  timeLabel: string;
  initials: string;
  unreadCount: number;
};

export function ConversationItem({
  conversationId,
  profileId,
  pseudo,
  preview,
  timeLabel,
  initials,
  unreadCount,
}: ConversationItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <article className="conv-row">
      <Link href={`/messages/${conversationId}`} className="conv-avatar-link" aria-label={`Ouvrir la conversation avec ${pseudo}`}>
        <div className="conv-avatar" aria-hidden="true">{initials}</div>
      </Link>
      <div className="conv-body">
        <ProfileLink profileId={profileId} username={pseudo} />
        <Link href={`/messages/${conversationId}`} className="conv-preview-link" aria-label={`Ouvrir la conversation avec ${pseudo}`}>
          <p className="conv-preview">{preview}</p>
        </Link>
      </div>
      <Link href={`/messages/${conversationId}`} className="conv-right" aria-label={`Ouvrir la conversation avec ${pseudo}`}>
        <span className="conv-time">{timeLabel}</span>
        {hasUnread ? <span className="unread-badge">{unreadCount}</span> : null}
      </Link>
    </article>
  );
}
