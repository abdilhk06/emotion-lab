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
import { detectChatMode, isCrisisMessage, LOCAL_CRISIS_RESPONSE } from "@/lib/chatbot/safety";

type ChatMessage = { id: string; role: "user" | "bot"; text: string; plan?: PlannerResponse };
type PlanMode = "emotional_support" | "planning" | "hybrid";

type PlanningIntake = {
  taskList: string[];
  deadline?: string;
  availableHours?: number;
  preferredStudyTime?: string;
  sleepConstraints?: string;
  taskDifficulty?: string;
  nightWorkPreference?: "yes" | "no" | "sometimes";
};

const QUICK_REPLIES = ["J'ai besoin de soutien", "Planifier ma semaine", "Mode hybride: moral + planning", "Transformer ma todo en plan"] as const;
const SAFETY_MESSAGE = "Cet assistant combine soutien emotionnel et planification personnalisee. En cas d'urgence, contacte un service d'aide ou une personne de confiance.";

export default function ChatbotPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<Record<string, unknown> | null>(null);
  const [planningIntake, setPlanningIntake] = useState<PlanningIntake>({ taskList: [] });
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const guard = async () => {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.replace("/login");

      const [resultRes, hobbiesRes] = await Promise.all([
        supabase
          .from("test_results")
          .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("user_hobbies").select("hobby").eq("user_id", auth.user.id),
      ]);

      setUserContext({
        hasPersonalizationData: Boolean(resultRes.data),
        stressScore: resultRes.data?.stress_score ?? null,
        organizationBalanceScore: resultRes.data?.balance_score ?? null,
        mbtiCode: resultRes.data?.mbti_code ?? null,
        mbtiName: resultRes.data?.mbti_name ?? null,
        bigFiveScores: resultRes.data?.big_five_scores ?? null,
        hobbies: (hobbiesRes.data ?? []).map((h) => h.hobby).filter(Boolean),
      });
      setIsReady(true);
    };

    void guard();
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  const updateIntakeFromText = (value: string) => {
    const next = { ...planningIntake };
    if (value.includes(",") || value.toLowerCase().includes("todo")) next.taskList = value.split(",").map((x) => x.trim()).filter(Boolean);
    const hours = value.match(/(\d+)\s*h/i);
    if (hours) next.availableHours = Number(hours[1]);
    if (/matin|apres-midi|soir|nuit/i.test(value)) next.preferredStudyTime = value;
    if (/sommeil|dorm/i.test(value)) next.sleepConstraints = value;
    if (/facile|moyen|difficile/i.test(value)) next.taskDifficulty = value;
    if (/nuit/i.test(value)) next.nightWorkPreference = /pas la nuit/i.test(value) ? "no" : "yes";
    if (/deadline|avant|pour le/i.test(value)) next.deadline = value;
    setPlanningIntake(next);
  };

  const getInputGaps = () => {
    const gaps: string[] = [];
    if (planningIntake.taskList.length === 0) gaps.push("task list");
    if (!planningIntake.deadline) gaps.push("deadline");
    if (!planningIntake.availableHours) gaps.push("available hours");
    if (!planningIntake.preferredStudyTime) gaps.push("preferred study time");
    if (!planningIntake.sleepConstraints) gaps.push("sleep constraints");
    if (!planningIntake.taskDifficulty) gaps.push("task difficulty");
    if (!planningIntake.nightWorkPreference) gaps.push("night-work preference");
    return gaps;
  };

  const sendMessage = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value || isTyping) return;

    updateIntakeFromText(value);
    const mode: PlanMode = detectChatMode(value);
    const userMessage: ChatMessage = { id: `${Date.now()}-u`, role: "user", text: value };
    setMessages((previous) => [...previous, userMessage]);
    setInputValue("");

    if (isCrisisMessage(value)) {
      setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: LOCAL_CRISIS_RESPONSE }]);
      return;
    }

    if (mode !== "emotional_support") {
      const gaps = getInputGaps();
      if (gaps.length > 0) {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-b`,
            role: "bot",
            text: `Avant plan complet, il me manque: ${gaps.join(", ")}. Donne ces infos en une reponse.`,
          },
        ]);
        return;
      }
    }

    setIsTyping(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return router.replace("/login");

      const context = messages.slice(-6).map((message) => ({ role: message.role, text: message.text }));
      const response = await fetch("/api/chatbot/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          message: value,
          context,
          mode,
          userContext: { ...(userContext ?? {}), planningPreferences: planningIntake },
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error("api_error");
      if (payload.crisis) setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: payload.message ?? LOCAL_CRISIS_RESPONSE }]);
      else {
        const plan: PlannerResponse = payload.plan;
        setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: plan.summary, plan }]);
      }
    } catch {
      setMessages((previous) => [...previous, { id: `${Date.now()}-b`, role: "bot", text: "Je n'arrive pas a repondre maintenant. Reessaie avec tes infos principales." }]);
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
          {!isReady ? <p className="chatbot-empty-state">Chargement de ton assistant...</p> : messages.length === 0 ? <p className="chatbot-empty-state">Partage ton etat emotionnel, ta todo, et ton deadline. Je te soutiens puis je construis plan personnalise.</p> : messages.map((message) => message.role === "bot" ? <BotMessage key={message.id} message={message.text} plan={message.plan} /> : <UserMessage key={message.id} message={message.text} />)}
          {isTyping ? <p className="chatbot-typing">Je prepare ta reponse...</p> : null}
          <div ref={endRef} />
        </section>
        <QuickReplies options={QUICK_REPLIES} onSelect={(value) => void sendMessage(value)} />
        <ChatbotFooter value={inputValue} onChange={setInputValue} onSend={() => void sendMessage(inputValue)} disabled={isSendDisabled} />
        <p className="chatbot-local-note">Assistant combine soutien emotionnel + planification personnalisee. Ne remplace pas prise en charge medicale.</p>
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
