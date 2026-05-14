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

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

const QUICK_REPLIES = [
  "Je suis stressé(e)",
  "J’ai du mal à dormir",
  "Je veux parler à quelqu’un",
  "Je veux un exercice rapide",
] as const;

const SAFETY_MESSAGE =
  "Cet assistant ne remplace pas un professionnel de santé. En cas d'urgence, contacte un service d'aide ou une personne de confiance.";

function buildSafeResponse(input: string) {
  const value = input.toLowerCase();

  if (value.includes("stress")) {
    return "Merci de me le dire. Quand le stress monte, fais une pause de 60 secondes: inspire 4 secondes, bloque 4 secondes, expire 6 secondes, puis recommence 5 fois. Si tu te sens en danger ou depasse(e), contacte tout de suite un service d'urgence ou une personne de confiance.";
  }

  if (value.includes("dormir") || value.includes("sommeil")) {
    return "Le sommeil peut vite se deregler quand la charge mentale est forte. Essaie un rituel court ce soir: ecran coupe 30 minutes avant, respiration lente 5 minutes, et note tes pensees sur papier. Si les nuits deviennent tres difficiles ou que tu te sens en detresse, parle rapidement a un professionnel ou a un service d'aide.";
  }

  if (value.includes("parler") || value.includes("quelqu")) {
    return "Tu n'es pas seul(e). Parler a quelqu'un de confiance peut vraiment soulager: un proche, un buddy, ou un service d'ecoute. Si la situation est urgente ou que tu crains pour ta securite, contacte immediatement un service d'urgence.";
  }

  if (value.includes("exercice") || value.includes("rapide")) {
    return "Exercice express (2 minutes): pose les pieds au sol, relache les epaules, puis nomme 5 choses que tu vois, 4 que tu touches, 3 que tu entends, 2 que tu sens, 1 que tu goutes. Cet ancrage peut aider a reduire la tension dans l'instant.";
  }

  return "Merci pour ton message. Je peux te proposer un soutien general, mais je ne pose pas de diagnostic medical. Si tu te sens en danger ou submerge(e), contacte sans attendre une personne de confiance ou un service d'urgence.";
}

export default function ChatbotPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
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
  }, [messages.length]);

  const sendMessage = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      text: value,
    };
    const botMessage: ChatMessage = {
      id: `${Date.now()}-b`,
      role: "bot",
      text: buildSafeResponse(value),
    };

    setMessages((previous) => [...previous, userMessage, botMessage]);
    setInputValue("");
  };

  const isSendDisabled = useMemo(() => inputValue.trim().length === 0, [inputValue]);

  return (
    <AppLayout title="Chatbot">
      <div className="chatbot-page">
        <ChatbotHeader />

        <p className="chatbot-safety-banner">{SAFETY_MESSAGE}</p>

        <section className="chatbot-messages" aria-live="polite" aria-label="Conversation">
          {!isReady ? (
            <p className="chatbot-empty-state">Chargement de ton assistant...</p>
          ) : messages.length === 0 ? (
            <p className="chatbot-empty-state">
              Ecris un message ou utilise une reponse rapide pour commencer. Je reponds uniquement avec un script local de soutien.
            </p>
          ) : (
            messages.map((message) =>
              message.role === "bot" ? <BotMessage key={message.id} message={message.text} /> : <UserMessage key={message.id} message={message.text} />
            )
          )}
          <div ref={endRef} />
        </section>

        <QuickReplies options={QUICK_REPLIES} onSelect={sendMessage} />

        <ChatbotFooter value={inputValue} onChange={setInputValue} onSend={() => sendMessage(inputValue)} disabled={isSendDisabled} />

        <p className="chatbot-local-note">Emotion Bot suit un script pre-ecrit. Les echanges ne sont pas stockes dans cette version.</p>
      </div>

      <style jsx>{`
        .chatbot-page {
          display: grid;
          gap: 12px;
          min-height: min(760px, calc(100vh - 180px));
        }

        .chatbot-safety-banner {
          margin: 0;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid #f0ccd2;
          background: #fff7f8;
          color: #7f2238;
          font-size: 14px;
          font-weight: 600;
        }

        .chatbot-messages {
          display: grid;
          gap: 10px;
          align-content: start;
          overflow: auto;
          background: linear-gradient(180deg, #fcf9fd 0%, #f4f8fb 100%);
          border: 1px solid var(--bordure);
          border-radius: 18px;
          padding: 14px;
          min-height: 260px;
          max-height: min(52vh, 560px);
        }

        .chatbot-empty-state {
          margin: 0;
          padding: 18px;
          border-radius: 14px;
          border: 1px dashed #d4c4e2;
          background: #fff;
          color: var(--texte-gris);
          text-align: center;
        }

        .chatbot-local-note {
          margin: 0;
          font-size: 13px;
          color: var(--texte-clair);
          text-align: center;
        }

        @media (max-width: 1023px) {
          .chatbot-page {
            min-height: auto;
          }

          .chatbot-messages {
            max-height: 50vh;
          }
        }
      `}</style>
    </AppLayout>
  );
}
