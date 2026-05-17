import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectChatMode, isCrisisMessage, LOCAL_CRISIS_RESPONSE } from "@/lib/chatbot/safety";
import { planRequestSchema, planResponseSchema } from "@/lib/chatbot/planner-schema";

const SYSTEM_INSTRUCTION =
  "Tu es assistant double role: soutien emotionnel + planification personnalisee pour etudiant·e francophone. Toujours commencer par securite: si detresse severe, repondre soutien + ressources, ne pas pousser productivite. Trois modes: emotional_support, planning, hybrid. En planning, demander uniquement infos manquantes avant plan complet. Personnaliser avec stress, organisation, MBTI, Big Five, hobbies et preferences. Regles plan: stress eleve => blocs plus courts, plus de pauses, charge quotidienne reduite; organisation elevee => checklist structuree + sequence serree; organisation basse => etapes simples + peu de taches paralleles; night preference => deep-work la nuit sans nuire sommeil; extraversion/introversion => proposer travail groupe/solo utile. Si pas de resultats test: expliquer personnalisation limitee, poser mini questions profilage, puis plan baseline prudent.";

const responseSchema = {
  type: "object",
  required: ["summary", "objective", "timeframe", "planSections", "todayChecklist", "weeklyPlan", "habits", "risks", "nextAction", "safetyNote"],
  properties: {
    summary: { type: "string" },
    objective: { type: "string" },
    timeframe: { type: "string" },
    mode: { type: "string", enum: ["emotional_support", "planning", "hybrid"] },
    inputGaps: { type: "array", items: { type: "string" } },
    timeBlocks: {
      type: "array",
      items: {
        type: "object",
        required: ["day", "start", "end", "focus", "priority", "breakNote"],
        properties: {
          day: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          focus: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          breakNote: { type: "string" },
        },
      },
    },
    planSections: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "description", "steps"],
        properties: { title: { type: "string" }, description: { type: "string" }, steps: { type: "array", items: { type: "string" } } },
      },
    },
    todayChecklist: { type: "array", items: { type: "string" } },
    weeklyPlan: {
      type: "array",
      items: {
        type: "object",
        required: ["day", "focus", "tasks"],
        properties: { day: { type: "string" }, focus: { type: "string" }, tasks: { type: "array", items: { type: "string" } } },
      },
    },
    habits: { type: "array", items: { type: "string" } },
    risks: {
      type: "array",
      items: {
        type: "object",
        required: ["risk", "prevention"],
        properties: { risk: { type: "string" }, prevention: { type: "string" } },
      },
    },
    nextAction: { type: "string" },
    safetyNote: { type: "string" },
  },
} as const;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !geminiKey) return NextResponse.json({ error: "Configuration serveur incomplete." }, { status: 500 });

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Non autorise." }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Non autorise." }, { status: 401 });

    const parsed = planRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Requete invalide." }, { status: 400 });

    const { message, context, userContext, mode } = parsed.data;
    if (isCrisisMessage(message)) return NextResponse.json({ crisis: true, message: LOCAL_CRISIS_RESPONSE }, { status: 200 });

    const [latestResultRes, hobbiesRes] = await Promise.all([
      supabase
        .from("test_results")
        .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_hobbies").select("hobby").eq("user_id", authData.user.id),
    ]);

    const personalization = {
      hasPersonalizationData: Boolean(latestResultRes.data),
      stressScore: latestResultRes.data?.stress_score ?? null,
      organizationBalanceScore: latestResultRes.data?.balance_score ?? null,
      mbtiCode: latestResultRes.data?.mbti_code ?? null,
      mbtiName: latestResultRes.data?.mbti_name ?? null,
      bigFiveScores: latestResultRes.data?.big_five_scores ?? null,
      hobbies: (hobbiesRes.data ?? []).map((h) => h.hobby).filter(Boolean),
      planningPreferences: userContext?.planningPreferences,
    };

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema },
      contents: JSON.stringify({ message, context, mode: mode ?? detectChatMode(message), userContext: { ...personalization, ...userContext } }, null, 2),
    });

    const text = result.text?.trim();
    if (!text) return NextResponse.json({ error: "Aucune reponse du modele." }, { status: 502 });

    return NextResponse.json({ crisis: false, plan: planResponseSchema.parse(JSON.parse(text)) });
  } catch {
    return NextResponse.json({ error: "Impossible de generer le plan pour le moment." }, { status: 500 });
  }
}
