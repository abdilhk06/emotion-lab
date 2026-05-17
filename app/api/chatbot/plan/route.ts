import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectChatMode, isCrisisMessage, LOCAL_CRISIS_RESPONSE } from "@/lib/chatbot/safety";
import { planRequestSchema, planResponseSchema } from "@/lib/chatbot/planner-schema";

const SYSTEM_INSTRUCTION =
  "Tu es assistant double role: soutien emotionnel + planification personnalisee pour etudiant·e francophone. Reponds dans la langue de l'utilisateur, principalement en francais pour cette app. Toujours commencer par securite: si detresse severe, repondre soutien + ressources, ne pas pousser productivite. Tu recois userContext avec donnees reelles Supabase. Tu dois utiliser les donnees connues avant toute question: si stressScore existe, n'appelle pas ca inconnu et ne demande pas si la personne est stressee; adapte directement. Si organizationBalanceScore, MBTI, Big Five, hobbies, studyLevel, pseudo ou profilePreferences existent, les integrer sobrement. Pour planning, inferer taches, deadlines, heures et contraintes depuis message + contexte + planningPreferences. Ne demander que l'information indispensable qui manque encore. Si une info manque, poser une seule courte question a la fois en francais, mettre inputGaps avec un seul item, et ne pas generer de faux planning complet. Trois modes: emotional_support, planning, hybrid. Regles plan: stress eleve => blocs plus courts, plus de pauses, charge quotidienne reduite; organisation elevee => checklist structuree + sequence serree; organisation basse => etapes simples + peu de taches paralleles; preference nuit => deep-work le soir/nuit mais sommeil protege; extraversion/introversion => proposer travail groupe/solo quand utile. Si aucun resultat/profil n'existe, dire que la personnalisation est limitee, poser une question de profilage rapide, puis proposer un plan baseline prudent si assez d'informations de planning sont deja donnees.";

function cleanOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

    const [latestResultRes, profileRes, hobbiesRes] = await Promise.all([
      supabase
        .from("test_results")
        .select("mbti_code, mbti_name, big_five_scores, stress_score, balance_score, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("pseudo, study_level, bio, looking_for").eq("id", authData.user.id).maybeSingle(),
      supabase.from("user_hobbies").select("hobby").eq("user_id", authData.user.id),
    ]);

    const serverUserContext = {
      hasPersonalizationData: Boolean(latestResultRes.data || profileRes.data),
      stressScore: latestResultRes.data?.stress_score ?? null,
      organizationBalanceScore: latestResultRes.data?.balance_score ?? null,
      mbtiCode: latestResultRes.data?.mbti_code ?? null,
      mbtiName: latestResultRes.data?.mbti_name ?? null,
      bigFiveScores: latestResultRes.data?.big_five_scores ?? null,
      hobbies: (hobbiesRes.data ?? []).map((h) => h.hobby).filter(Boolean),
      studyLevel: cleanOptional(profileRes.data?.study_level),
      pseudo: cleanOptional(profileRes.data?.pseudo),
      profilePreferences: {
        bio: cleanOptional(profileRes.data?.bio),
        lookingFor: cleanOptional(profileRes.data?.looking_for),
      },
      planningPreferences: userContext?.planningPreferences,
    };
    const effectiveUserContext = { ...(userContext ?? {}), ...serverUserContext };

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema },
      contents: JSON.stringify(
        {
          message,
          context,
          mode: mode ?? detectChatMode(message),
          userContext: effectiveUserContext,
          responseRules: [
            "Utilise d'abord userContext. Ne redemande jamais une donnee deja presente.",
            "Pour une demande planning, inferer depuis message et context avant de poser une question.",
            "Si question necessaire, poser exactement une question courte, inputGaps doit contenir exactement un item.",
            "Si hasPersonalizationData=false, dire que la personnalisation est limitee et demander une question profilage rapide.",
          ],
        },
        null,
        2
      ),
    });

    const text = result.text?.trim();
    if (!text) return NextResponse.json({ error: "Aucune reponse du modele." }, { status: 502 });

    return NextResponse.json({ crisis: false, plan: planResponseSchema.parse(JSON.parse(text)) });
  } catch {
    return NextResponse.json({ error: "Impossible de generer le plan pour le moment." }, { status: 500 });
  }
}
