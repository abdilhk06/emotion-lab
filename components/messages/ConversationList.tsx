"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { ConversationItem } from "@/components/messages/ConversationItem";
import { getSupabaseClient } from "@/lib/supabase/client";

type ConversationRow = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  user_1_id?: string | null;
  user_2_id?: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  conversation_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  pseudo: string | null;
};

type ConversationViewModel = {
  id: string;
  pseudo: string;
  initials: string;
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
};

type MessagesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: ConversationViewModel[] };

function computeOtherUserId(conversation: ConversationRow, currentUserId: string): string | null {
  const first = conversation.user_1_id ?? conversation.sender_id ?? null;
  const second = conversation.user_2_id ?? conversation.receiver_id ?? null;

  if (!first || !second) return null;
  if (first === currentUserId) return second;
  if (second === currentUserId) return first;
  return null;
}

function formatPseudo(pseudo: string | null): string {
  const trimmed = pseudo?.trim();
  if (!trimmed) return "@buddy";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function toInitials(value: string): string {
  const cleaned = value.replace(/^@/, "").trim();
  if (!cleaned) return "B";
  return cleaned.slice(0, 1).toUpperCase();
}

function formatTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const mins = Math.max(1, Math.round(diffMs / minute));
    return mins <= 1 ? "A l'instant" : `Il y a ${mins} min`;
  }

  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `Il y a ${hours} h`;
  }

  if (diffMs < 2 * day) {
    return "Hier";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

async function fetchConversationsForUser(userId: string) {
  const supabase = getSupabaseClient();

  const canonical = await supabase
    .from("conversations")
    .select("id, sender_id, receiver_id, user_1_id, user_2_id, created_at, updated_at")
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .returns<ConversationRow[]>();
  return canonical;
}

export function ConversationList() {
  const router = useRouter();
  const [state, setState] = useState<MessagesState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });

      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const conversationsRes = await fetchConversationsForUser(user.id);
        if (conversationsRes.error) {
          setState({ status: "error", message: conversationsRes.error.message });
          return;
        }

        const conversations = conversationsRes.data ?? [];
        if (conversations.length === 0) {
          setState({ status: "ready", items: [] });
          return;
        }

        const otherIds = Array.from(
          new Set(
            conversations
              .map((conversation) => computeOtherUserId(conversation, user.id))
              .filter((id): id is string => Boolean(id))
          )
        );

        const [messagesRes, profilesRes] = await Promise.all([
          supabase
            .from("messages")
            .select("conversation_id, body, created_at")
            .in(
              "conversation_id",
              conversations.map((conversation) => conversation.id)
            )
            .order("created_at", { ascending: false })
            .returns<MessageRow[]>(),
          supabase.from("profiles").select("id, pseudo").in("id", otherIds).returns<ProfileRow[]>(),
        ]);

        const firstError = messagesRes.error ?? profilesRes.error;
        if (firstError) {
          setState({ status: "error", message: firstError.message });
          return;
        }

        const latestMessageByConversation = new Map<string, MessageRow>();
        for (const msg of messagesRes.data ?? []) {
          if (!latestMessageByConversation.has(msg.conversation_id)) {
            latestMessageByConversation.set(msg.conversation_id, msg);
          }
        }

        const profileById = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));

        const items = conversations
          .map((conversation) => {
            const otherUserId = computeOtherUserId(conversation, user.id);
            if (!otherUserId) return null;

            const profile = profileById.get(otherUserId);
            const pseudo = formatPseudo(profile?.pseudo ?? null);
            const latestMessage = latestMessageByConversation.get(conversation.id);
            const fallbackDate = conversation.updated_at || conversation.created_at;
            const lastMessageAt = latestMessage?.created_at ?? fallbackDate;

            return {
              id: conversation.id,
              pseudo,
              initials: toInitials(pseudo),
              preview: latestMessage?.body?.trim() || "Aucun message pour le moment.",
              lastMessageAt,
              unreadCount: 0,
            } satisfies ConversationViewModel;
          })
          .filter((item): item is ConversationViewModel => Boolean(item))
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

        setState({ status: "ready", items });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
        });
      }
    };

    void run();
  }, [router]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="state-card" role="status" aria-live="polite">
          <h2>Chargement de tes conversations...</h2>
          <p>On retrouve tes derniers echanges avec tes buddies.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="state-card state-error" role="alert">
          <h2>Impossible de charger la messagerie</h2>
          <p>{state.message}</p>
        </section>
      );
    }

    const filteredItems = state.items.filter((item) => {
      const search = query.trim().toLowerCase();
      if (!search) return true;
      return `${item.pseudo} ${item.preview}`.toLowerCase().includes(search);
    });

    if (filteredItems.length === 0) {
      return (
        <section className="state-card" role="status">
          <h2>Aucune conversation trouvée</h2>
          <p>Essaie un autre pseudo ou démarre une nouvelle discussion depuis l&apos;annuaire.</p>
          <Link className="btn btn-primary" href="/buddies">
            Aller vers l&apos;annuaire Buddy
          </Link>
        </section>
      );
    }

    return (
      <section className="conv-list" aria-label="Liste des conversations">
        {filteredItems.map((item) => (
          <ConversationItem
            key={item.id}
            conversationId={item.id}
            pseudo={item.pseudo}
            preview={item.preview}
            timeLabel={formatTimeLabel(item.lastMessageAt)}
            initials={item.initials}
            unreadCount={item.unreadCount}
          />
        ))}
      </section>
    );
  }, [query, state]);

  return (
    <AppLayout title="Messagerie">
      <div className="messages-page">
        <h1>Messagerie</h1>
        <label className="messages-search" aria-label="Rechercher une conversation">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une conversation..."
          />
        </label>
        {content}
      </div>

      <style jsx>{`
        .messages-page {
          max-width: 1020px;
          margin: 0;
          padding: 18px 8px 80px;
          display: grid;
          gap: 0;
          color: #071238;
        }

        .messages-page h1 {
          margin: 0 0 20px;
          color: #071238;
          font-family: "Poppins", sans-serif;
          font-size: 36px;
          font-weight: 800;
        }

        .messages-search {
          height: 44px;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #e5e0ec;
          border-radius: 12px;
          padding: 0 18px;
          margin-bottom: 22px;
        }

        .messages-search::before {
          content: "⌕";
          color: #61708a;
          margin-right: 10px;
        }

        .messages-search input {
          width: 100%;
          border: 0;
          outline: 0;
          color: #071238;
          font-size: 14px;
          background: transparent;
        }

        .conv-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .state-card {
          background: radial-gradient(120% 100% at 0% 0%, rgba(247, 186, 193, 0.17), transparent 50%),
            radial-gradient(120% 120% at 100% 0%, rgba(142, 192, 201, 0.14), transparent 52%),
            #fff;
          border: 1px solid var(--bordure);
          border-radius: 18px;
          padding: 20px;
        }

        .state-card h2 {
          margin: 0 0 8px;
        }

        .state-card p {
          margin: 0 0 14px;
          color: var(--texte-gris);
        }

        .state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }

        :global(.conv-row) {
          display: flex;
          align-items: center;
          gap: 14px;
          background: transparent;
          border: 0;
          border-radius: 14px;
          padding: 14px;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
          position: relative;
        }
        :global(.conv-row:hover) {
          background: #f5f0f7;
        }
        :global(.conv-avatar) {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #8b4d73, #6f92b8);
          color: #fff;
          font-family: "Poppins", sans-serif;
          font-weight: 800;
          font-size: 19px;
          display: grid;
          place-items: center;
        }
        :global(.conv-body) {
          flex: 1;
          min-width: 0;
        }
        :global(.conv-handle) {
          color: #7e3d5e;
          font-weight: 800;
          font-size: 15px;
        }
        :global(.conv-preview) {
          margin: 5px 0 0;
          color: #25395e;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        :global(.conv-right) {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        :global(.conv-time) {
          color: #64718b;
          font-size: 12px;
        }
        :global(.unread-badge) {
          background: #8a3b65;
          color: #fff;
          border-radius: 999px;
          width: 20px;
          height: 20px;
          font-size: 11px;
          font-weight: 700;
          display: grid;
          place-items: center;
        }
      `}</style>
    </AppLayout>
  );
}
