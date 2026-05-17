"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { ConversationTopBar } from "@/components/messages/ConversationTopBar";
import { MessageInputBar } from "@/components/messages/MessageInputBar";
import { MessagesList } from "@/components/messages/MessagesList";
import { ModerationNote } from "@/components/messages/ModerationNote";
import { getSupabaseClient } from "@/lib/supabase/client";

type ConversationRow = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  user_1_id?: string | null;
  user_2_id?: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  pseudo: string | null;
  study_level: string | null;
};

type ConversationState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      currentUserId: string;
      buddy: { pseudo: string; studyLevel: string; initials: string };
      messages: { id: string; senderId: string; content: string; createdAt: string }[];
    };

function formatPseudo(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "@buddy";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function getInitials(pseudo: string): string {
  const normalized = pseudo.replace(/^@/, "").trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "B";
}

function resolveParticipants(conversation: ConversationRow) {
  const first = conversation.user_1_id ?? conversation.sender_id ?? null;
  const second = conversation.user_2_id ?? conversation.receiver_id ?? null;
  return { first, second };
}

async function insertMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageRow> {
  const supabase = getSupabaseClient();

  const result = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: content })
    .select("id, sender_id, body, created_at")
    .single<MessageRow>();

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Impossible d'envoyer le message.");
  }

  return result.data;
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const conversationId = params.id;

  const [state, setState] = useState<ConversationState>({ status: "loading" });
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setState({ status: "loading" });
      setSendError(null);

      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const conversationRes = await supabase
          .from("conversations")
          .select("id, sender_id, receiver_id, user_1_id, user_2_id")
          .eq("id", conversationId)
          .maybeSingle<ConversationRow>();

        if (conversationRes.error) {
          setState({ status: "error", message: conversationRes.error.message });
          return;
        }

        if (!conversationRes.data) {
          setState({ status: "not-found" });
          return;
        }

        const { first, second } = resolveParticipants(conversationRes.data);
        if (!first || !second) {
          setState({ status: "error", message: "Conversation invalide." });
          return;
        }

        if (user.id !== first && user.id !== second) {
          setState({ status: "unauthorized" });
          return;
        }

        const buddyId = user.id === first ? second : first;

        const [buddyRes, messagesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, pseudo, study_level")
            .eq("id", buddyId)
            .maybeSingle<ProfileRow>(),
          supabase
            .from("messages")
            .select("id, sender_id, body, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .returns<MessageRow[]>(),
        ]);

        const queryError = buddyRes.error ?? messagesRes.error;
        if (queryError) {
          setState({ status: "error", message: queryError.message });
          return;
        }

        const pseudo = formatPseudo(buddyRes.data?.pseudo);

        setState({
          status: "ready",
          currentUserId: user.id,
          buddy: {
            pseudo,
            studyLevel: buddyRes.data?.study_level?.trim() || "Niveau non precise",
            initials: getInitials(pseudo),
          },
          messages: (messagesRes.data ?? []).map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            content: row.body?.trim() || "",
            createdAt: row.created_at,
          })),
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
        });
      }
    };

    void run();
  }, [conversationId, router]);

  const handleSend = useCallback(
    async (content: string) => {
      if (state.status !== "ready") return;

      setIsSending(true);
      setSendError(null);

      try {
        const newMessage = await insertMessage(conversationId, state.currentUserId, content);

        setState((prev) => {
          if (prev.status !== "ready") return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: newMessage.id,
                senderId: newMessage.sender_id,
                content: newMessage.body?.trim() || content,
                createdAt: newMessage.created_at,
              },
            ],
          };
        });
      } catch (error) {
        setSendError(error instanceof Error ? error.message : "L'envoi du message a echoue.");
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, state]
  );

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <section className="state-card" role="status" aria-live="polite">
          <h2>Chargement de la conversation...</h2>
          <p>On recupere les messages de ton buddy.</p>
        </section>
      );
    }

    if (state.status === "not-found") {
      return (
        <section className="state-card state-error" role="alert">
          <h2>Conversation introuvable</h2>
          <p>Cette conversation n&apos;existe pas ou n&apos;est plus disponible.</p>
        </section>
      );
    }

    if (state.status === "unauthorized") {
      return (
        <section className="state-card state-error" role="alert">
          <h2>Acces refuse</h2>
          <p>Tu ne peux pas consulter cette conversation.</p>
        </section>
      );
    }

    if (state.status === "error") {
      return (
        <section className="state-card state-error" role="alert">
          <h2>Erreur de messagerie</h2>
          <p>{state.message}</p>
        </section>
      );
    }

    return (
      <div className="conversation-wrap">
        <ConversationTopBar
          pseudo={state.buddy.pseudo}
          studyLevel={state.buddy.studyLevel}
          initials={state.buddy.initials}
        />
        <MessagesList messages={state.messages} currentUserId={state.currentUserId} />
        {sendError ? (
          <p className="send-error" role="alert">
            {sendError}
          </p>
        ) : null}
        {isSending ? (
          <p className="send-state" role="status" aria-live="polite">
            Envoi en cours...
          </p>
        ) : null}
        <MessageInputBar onSend={handleSend} disabled={isSending} />
        <ModerationNote />
      </div>
    );
  }, [handleSend, isSending, sendError, state]);

  return (
    <AppLayout title="Conversation">
      {content}

      <style jsx>{`
        .conversation-wrap {
          max-width: 1020px;
          height: calc(100vh - 48px);
          margin: 0;
          display: flex;
          flex-direction: column;
          border-left: 1px solid #e5e0ec;
          border-right: 1px solid #e5e0ec;
          background: #fffcff;
        }

        .state-card {
          background: #fff;
          border: 1px solid var(--bordure);
          border-radius: 14px;
          padding: 18px;
        }

        .state-card h2 {
          margin: 0 0 8px;
          font-size: 22px;
        }

        .state-card p {
          margin: 0;
          color: var(--texte-gris);
        }

        .state-error {
          border-color: #f3c7ce;
          background: #fff8f9;
        }

        .send-state,
        .send-error {
          margin: 0;
          padding: 0 20px;
          font-size: 13px;
          color: var(--texte-clair);
        }

        .send-error {
          color: #b42318;
        }
      `}</style>
    </AppLayout>
  );
}
