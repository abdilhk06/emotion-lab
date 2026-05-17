import type { BigFiveScores } from "@/lib/calculate-result";

export type ResultCopyInput = {
  mbtiCode: string;
  mbtiName: string;
  scores: BigFiveScores;
  stressScore: number;
  balanceScore: number;
};

export type ResultInterpretation = {
  explanation: string;
  strengths: string[];
  watchPoints: string[];
  workStyle: string;
  buddyHint: string;
};

const MBTI_EXPLANATIONS: Record<string, string> = {
  ENFJ: "Tu sembles avancer avec chaleur, sens du collectif et envie de mobiliser les autres.",
  INFJ: "Ton profil combine profondeur, intuition et attention aux dynamiques humaines.",
  ENFP: "Tu apportes souvent énergie, créativité et optimisme dans les environnements en mouvement.",
  INFP: "Tu avances avec authenticité, sensibilité et recherche de sens dans tes choix.",
  ENTJ: "Tu as tendance à structurer vite, décider clairement et entraîner une équipe.",
  INTJ: "Tu combines vision stratégique, autonomie et rigueur pour aller au bout de tes idées.",
  INTP: "Tu sembles aimer comprendre les systèmes, analyser et garder de la souplesse.",
  ENTP: "Tu fonctionnes bien avec les idées nouvelles, le débat et les projets à explorer.",
  ISTJ: "Ton profil valorise les repères clairs, la fiabilité et le travail suivi.",
  ISFJ: "Tu sembles attentif aux autres, constant et sensible à un cadre rassurant.",
  ESTJ: "Tu avances avec organisation, sens pratique et besoin d'objectifs concrets.",
  ESFJ: "Tu sembles à l'aise dans le lien, la coopération et les environnements bien coordonnés.",
  ISTP: "Tu privilégies souvent l'action concrète, l'observation et l'autonomie.",
  ISFP: "Tu avances avec sensibilité, discrétion et attention à ce qui a du sens pour toi.",
  ESTP: "Tu sembles énergisé par l'action, les situations concrètes et les décisions rapides.",
  ESFP: "Tu apportes présence, énergie relationnelle et goût des expériences partagées.",
};

function pickTopTraits(scores: BigFiveScores): Array<[string, number]> {
  const traits: Array<[string, number]> = [
    ["ouverture", scores.openness],
    ["consciencieusité", scores.conscientiousness],
    ["extraversion", scores.extraversion],
    ["agréabilité", scores.agreeableness],
    ["sensibilité au stress", scores.neuroticism],
  ];
  return traits.sort((a, b) => b[1] - a[1]);
}

export function buildResultInterpretation(input: ResultCopyInput): ResultInterpretation {
  const topTraits = pickTopTraits(input.scores);
  const strengths: string[] = [];
  const watchPoints: string[] = [];

  if (input.scores.agreeableness >= 60) strengths.push("Relationnel coopératif: tu peux créer un climat de confiance dans un groupe.");
  if (input.scores.extraversion >= 60) strengths.push("Énergie sociale: les échanges peuvent nourrir ta motivation.");
  if (input.scores.openness >= 60) strengths.push("Curiosité: tu peux explorer plusieurs pistes avant de choisir.");
  if (input.scores.conscientiousness >= 60) strengths.push("Structure: tu sais transformer une intention en plan d'action.");
  if (input.balanceScore >= 65) strengths.push("Équilibre: tu sembles combiner organisation et récupération avec régularité.");

  if (input.stressScore >= 65) watchPoints.push("Pression élevée: prévois des pauses visibles et des objectifs plus petits.");
  if (input.scores.neuroticism >= 65) watchPoints.push("Réactivité émotionnelle: anticipe les périodes intenses avec des routines simples.");
  if (input.scores.conscientiousness < 45) watchPoints.push("Cadre de travail: quelques repères fixes peuvent aider à garder le cap.");
  if (input.scores.extraversion < 45) watchPoints.push("Énergie sociale: garde du temps calme après les interactions longues.");
  if (input.balanceScore < 45) watchPoints.push("Organisation: réduis la charge en priorisant une action claire à la fois.");

  while (strengths.length < 3) {
    const trait = topTraits[strengths.length]?.[0] ?? "profil";
    strengths.push(`Point d'appui ${strengths.length + 1}: ton score de ${trait} donne une piste utile pour mieux travailler.`);
  }

  while (watchPoints.length < 3) {
    watchPoints.push("Point de vigilance: ajuste ton rythme quand la charge de travail augmente.");
  }

  const workStyle =
    input.balanceScore >= 65
      ? "Travaille avec un planning clair, des blocs courts et des objectifs mesurables."
      : input.stressScore >= 65
        ? "Découpe les tâches, limite les longues sessions et ajoute des pauses de récupération."
        : "Garde une organisation légère: priorités du jour, temps de focus, puis bilan rapide.";

  const buddyHint =
    input.scores.extraversion >= 55
      ? "Un buddy calme et structuré peut compléter ton énergie relationnelle."
      : "Un buddy encourageant et régulier peut aider à garder le lien sans te surcharger.";

  return {
    explanation: MBTI_EXPLANATIONS[input.mbtiCode] ?? `Ton profil ${input.mbtiName} donne une lecture indicative de tes préférences actuelles.`,
    strengths: strengths.slice(0, 3),
    watchPoints: watchPoints.slice(0, 3),
    workStyle,
    buddyHint,
  };
}
