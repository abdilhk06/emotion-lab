import type { PlannerRequest } from "@/lib/chatbot/planner-schema";

type ProfileContext = {
  pseudo: string | null;
  studyLevel: string | null;
  bio: string | null;
  lookingFor: string | null;
  mbtiCode: string | null;
  mbtiName: string | null;
  bigFiveScores: unknown | null;
  stressScore: number | null;
  organizationBalanceScore: number | null;
  hobbies: string[];
};

function valueOrUnknown(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "inconnu";
  return String(value);
}

function organizationProfile(score: number | null): string {
  if (score === null) return "inconnu";
  if (score >= 70) return "structure forte";
  if (score >= 40) return "structure moderee";
  return "besoin de structure simple";
}

function formatTask(task: PlannerRequest["tasks"][number], index: number): string {
  const details = [
    task.durationMinutes ? `duree ${task.durationMinutes} min` : null,
    task.deadline ? `deadline ${task.deadline}` : null,
    task.importance ? `importance ${task.importance}` : null,
    task.type ? `type ${task.type}` : null,
    task.notes ? `notes ${task.notes}` : null,
  ].filter(Boolean);

  return `${index + 1}. ${task.title}${details.length ? ` (${details.join(", ")})` : ""}`;
}

export function buildPlanningSystemPrompt(profile: ProfileContext): string {
  return [
    "Tu es un assistant de planification pour etudiant francophone.",
    "Retourne uniquement un JSON valide conforme au schema fourni. Aucun Markdown. Aucun champ hors contrat.",
    "Construit un planning concret avec dates, heures, durees, taches, methodes et conseils.",
    "Adapte le plan aux donnees Supabase suivantes, sans pretendre connaitre ce qui est inconnu.",
    `pseudo: ${valueOrUnknown(profile.pseudo)}`,
    `niveau_etudes: ${valueOrUnknown(profile.studyLevel)}`,
    `bio: ${valueOrUnknown(profile.bio)}`,
    `objectif_relationnel: ${valueOrUnknown(profile.lookingFor)}`,
    `MBTI: ${valueOrUnknown(profile.mbtiCode)} ${valueOrUnknown(profile.mbtiName)}`,
    `Big Five: ${profile.bigFiveScores ? JSON.stringify(profile.bigFiveScores) : "inconnu"}`,
    `score_stress: ${valueOrUnknown(profile.stressScore)}`,
    `score_organisation: ${valueOrUnknown(profile.organizationBalanceScore)}`,
    `profil_organisation: ${organizationProfile(profile.organizationBalanceScore)}`,
    `hobbies: ${profile.hobbies.length ? profile.hobbies.join(", ") : "inconnu"}`,
    "P1: securite et charge realiste; si stress eleve, reduis les blocs et ajoute des pauses.",
    "P2: personnalisation; utilise pseudo, MBTI, Big Five, hobbies et profil organisation quand ils existent.",
    "P3: execution; priorise les taches proches de la deadline et donne des actions simples.",
  ].join("\n");
}

export function buildPlanningUserPrompt(input: PlannerRequest, serverTodayDate: string): string {
  return [
    "Tâches à organiser",
    `Nombre de tâches: ${input.taskCount}`,
    `Deadline globale: ${input.globalDeadline}`,
    `Date du jour: ${input.todayDate ?? serverTodayDate}`,
    "Liste:",
    ...input.tasks.map(formatTask),
    "Génère le planning au format JSON spécifié.",
  ].join("\n");
}
