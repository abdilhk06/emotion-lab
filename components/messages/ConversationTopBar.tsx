"use client";

import Link from "next/link";
import { ProfileLink } from "@/components/ui/ProfileLink";
import { UserAvatar } from "@/components/ui/UserAvatar";

type ConversationTopBarProps = {
  profileId: string;
  pseudo: string;
  studyLevel: string;
  avatarPath: string | null;
};

export function ConversationTopBar({ profileId, pseudo, studyLevel, avatarPath }: ConversationTopBarProps) {
  return (
    <header className="conversation-top-bar">
      <Link className="back-btn" href="/messages" aria-label="Retour a la messagerie">
        ←
      </Link>

      <UserAvatar name={pseudo} avatarPath={avatarPath} size={38} className="avatar" />

      <div className="buddy-meta">
        <h2>
          <ProfileLink profileId={profileId} username={pseudo} />
        </h2>
        <p><span aria-hidden="true">●</span> En ligne · {studyLevel}</p>
      </div>

      <style jsx>{`
        .conversation-top-bar {
          min-height: 66px;
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 12px;
          align-items: center;
          border-bottom: 1px solid #e5e0ec;
          background: #fff;
          padding: 0 20px;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--texte);
          text-decoration: none;
          font-size: 18px;
          background: transparent;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          background: linear-gradient(135deg, #8b4d73, #6f92b8);
        }

        .buddy-meta h2 {
          margin: 0;
          font-family: "Poppins", sans-serif;
          font-size: 16px;
          color: #071238;
        }

        .buddy-meta p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #35b66b;
        }
      `}</style>
    </header>
  );
}
