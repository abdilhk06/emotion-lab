"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout/AppLayout";
import { BotMessage } from "@/components/chatbot/BotMessage";
import { ChatbotFooter } from "@/components/chatbot/ChatbotFooter";
import { ChatbotHeader } from "@/components/chatbot/ChatbotHeader";
import { QuickReplies } from "@/components/chatbot/QuickReplies";
import { UserMessage } from "@/components/chatbot/UserMessage";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PlannerResponse } from "@/lib/chatbot/planner-schema";
import { isCrisisMessage, LOCAL_CRISIS_RESPONSE } from "@/lib/chatbot/safety";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  plan?: PlannerResponse;
};

const QUICK_REPLIES = ["Planifier ma semaine", "Organiser mes revisions", "Transformer ma todo en plan", "Je suis deborde·e"] as const;

const SAFETY_MESSAGE =
  "Cet assistant ne remplace pas un professionnel de sante. En cas d'urgence, contacte un service d'aide ou une personne de confiance.";

export default function ChatbotPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const guard = async () => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setIsReady(true);
    };

    void guard();
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  const sendMessage = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value || isTyping) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-u`, role: "user", text: value };
    setMessages((previous) => [...previous, userMessage]);
    setInputValue("");

    if (isCrisisMessage(value)) {
      setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: LOCAL_CRISIS_RESPONSE }]);
      return;
    }

    setIsTyping(true);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/login");
        return;
      }

      const context = messages.slice(-6).map((message) => ({ role: message.role, text: message.text }));

      const response = await fetch("/api/chatbot/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: value, context }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error("api_error");

      if (payload.crisis) {
        setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: payload.message ?? LOCAL_CRISIS_RESPONSE }]);
      } else {
        const plan: PlannerResponse = payload.plan;
        setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: plan.summary, plan }]);
      }
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-b`,
          role: "bot",
          text: "Je n'arrive pas a generer ton plan maintenant. Reessaie dans un instant avec ton objectif principal.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const isSendDisabled = useMemo(() => inputValue.trim().length === 0 || isTyping, [inputValue, isTyping]);

  return (
    <AppLayout title="Chatbot">
      <div className="chatbot-page">
        <ChatbotHeader />
        <p className="chatbot-safety-banner">{SAFETY_MESSAGE}</p>
        <section className="chatbot-messages" aria-live="polite" aria-label="Conversation">
          {!isReady ? (
            <p className="chatbot-empty-state">Chargement de ton assistant...</p>
          ) : messages.length === 0 ? (
            <p className="chatbot-empty-state">Ecris ton objectif, ta todo, ou ta charge de revisions et je te retourne un plan actionnable.</p>
          ) : (
            messages.map((message) =>
              message.role === "bot" ? <BotMessage key={message.id} message={message.text} plan={message.plan} /> : <UserMessage key={message.id} message={message.text} />
            )
          )}
          {isTyping ? <p className="chatbot-typing">Je prepare ton plan...</p> : null}
          <div ref={endRef} />
        </section>
        <QuickReplies options={QUICK_REPLIES} onSelect={(value) => void sendMessage(value)} />
        <ChatbotFooter value={inputValue} onChange={setInputValue} onSend={() => void sendMessage(inputValue)} disabled={isSendDisabled} />
        <p className="chatbot-local-note">Les echanges ne sont pas stockes dans cette version. Assistant de planification uniquement, pas de support medical/professionnel.</p>
      </div>

      <style jsx>{`
        .chatbot-page { display: grid; gap: 12px; min-height: min(760px, calc(100vh - 180px)); }
        .chatbot-safety-banner { margin: 0; padding: 12px 14px; border-radius: 14px; border: 1px solid #f0ccd2; background: #fff7f8; color: #7f2238; font-size: 14px; font-weight: 600; }
        .chatbot-messages { display: grid; gap: 10px; align-content: start; overflow: auto; background: linear-gradient(180deg, #fcf9fd 0%, #f4f8fb 100%); border: 1px solid var(--bordure); border-radius: 18px; padding: 14px; min-height: 260px; max-height: min(52vh, 560px); }
        .chatbot-empty-state { margin: 0; padding: 18px; border-radius: 14px; border: 1px dashed #d4c4e2; background: #fff; color: var(--texte-gris); text-align: center; }
        .chatbot-typing { margin: 0; color: var(--texte-clair); font-size: 13px; }
        .chatbot-local-note { margin: 0; font-size: 13px; color: var(--texte-clair); text-align: center; }
        @media (max-width: 1023px) { .chatbot-page { min-height: auto; } .chatbot-messages { max-height: 50vh; } }
      `}</style>
    </AppLayout>
  );
}
