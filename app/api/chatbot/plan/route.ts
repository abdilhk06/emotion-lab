import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildPlanningSystemPrompt, buildPlanningUserPrompt } from "@/lib/chatbot/buildPlanningPrompt";
import { containsSafetyKeyword } from "@/lib/chatbot/safety";
import { alertResponseSchema, planRequestSchema, planResponseSchema } from "@/lib/chatbot/planner-schema";

type ApiErrorCode = "auth" | "validation" | "safety" | "ai_parse" | "ai_schema" | "supabase" | "unknown" | "config";

const responseSchema = {
  type: "object",
  required: ["synthese", "planning", "conseils_generaux", "actions_suggerees"],
  properties: {
    synthese: {
      type: "object",
      required: ["nb_taches", "deadline_globale", "duree_planning_jours", "charge_totale_minutes", "methode_recommandee"],
      properties: {
        nb_taches: { type: "integer" },
        deadline_globale: { type: "string" },
        duree_planning_jours: { type: "integer" },
        charge_totale_minutes: { type: "integer" },
        methode_recommandee: { type: "string" },
      },
    },
    planning: {
      type: "array",
      items: {
        type: "object",
        required: ["date", "jour", "heure_debut", "heure_fin", "duree_min", "tache", "type", "importance", "methode", "conseil"],
        properties: {
          date: { type: "string" },
          jour: { type: "string" },
          heure_debut: { type: "string" },
          heure_fin: { type: "string" },
          duree_min: { type: "integer" },
          tache: { type: "string" },
          type: { type: "string" },
          importance: { type: "string" },
          methode: { type: "string" },
          conseil: { type: "string" },
        },
      },
    },
    conseils_generaux: { type: "array", items: { type: "string" } },
    actions_suggerees: { type: "array", items: { type: "string", enum: ["regenerate", "edit_task", "add_task", "export_pdf"] } },
  },
} as const;

function cleanOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function jsonError(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function safetyText(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") return Object.values(input).map(safetyText).join("\n");
  return "";
}

function serverDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !geminiKey) {
      return jsonError("config", "Configuration serveur incomplete.", 500);
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return jsonError("auth", "Non autorise.", 401);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return jsonError("auth", "Non autorise.", 401);

    const parsed = planRequestSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("validation", "Payload de planification invalide.", 400, parsed.error.flatten());

    const planningInput = parsed.data;
    if (containsSafetyKeyword(safetyText(planningInput))) {
      return NextResponse.json(alertResponseSchema.parse({ type: "alerte_securite", redirect: "ressources_urgence" }));
    }

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

    const supabaseError = latestResultRes.error ?? profileRes.error ?? hobbiesRes.error;
    if (supabaseError) return jsonError("supabase", "Impossible de charger le profil Supabase.", 502);

    const profile = {
      pseudo: cleanOptional(profileRes.data?.pseudo),
      studyLevel: cleanOptional(profileRes.data?.study_level),
      bio: cleanOptional(profileRes.data?.bio),
      lookingFor: cleanOptional(profileRes.data?.looking_for),
      mbtiCode: cleanOptional(latestResultRes.data?.mbti_code),
      mbtiName: cleanOptional(latestResultRes.data?.mbti_name),
      bigFiveScores: latestResultRes.data?.big_five_scores ?? null,
      stressScore: latestResultRes.data?.stress_score ?? null,
      organizationBalanceScore: latestResultRes.data?.balance_score ?? null,
      hobbies: (hobbiesRes.data ?? []).map((h) => h.hobby).filter(Boolean),
    };

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: buildPlanningSystemPrompt(profile),
        responseMimeType: "application/json",
        responseSchema,
      },
      contents: buildPlanningUserPrompt(planningInput, serverDate()),
    });

    const text = result.text?.trim();
    if (!text) return jsonError("ai_parse", "Aucune reponse du modele.", 502);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return jsonError("ai_parse", "La reponse IA n'est pas un JSON valide.", 502);
    }

    const plan = planResponseSchema.safeParse(json);
    if (!plan.success) return jsonError("ai_schema", "La reponse IA ne respecte pas le contrat planning.", 502, plan.error.flatten());

    return NextResponse.json({ crisis: false, plan: plan.data });
  } catch (error) {
    if (error instanceof ZodError) return jsonError("validation", "Payload invalide.", 400, error.flatten());
    return jsonError("unknown", "Impossible de generer le plan pour le moment.", 500);
  }
}
