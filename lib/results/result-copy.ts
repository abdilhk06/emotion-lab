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
  ENFP: "Tu apportes souvent energie, creativite et optimisme dans les environnements en mouvement.",
  INFP: "Tu avances avec authenticite, sensibilite et recherche de sens dans tes choix.",
  ENTJ: "Tu as tendance a structurer vite, decider clairement et entrainer une equipe.",
  INTJ: "Tu combines vision strategique, autonomie et rigueur pour aller au bout de tes idees.",
  INTP: "Tu sembles aimer comprendre les systemes, analyser et garder de la souplesse.",
  ENTP: "Tu fonctionnes bien avec les idees nouvelles, le debat et les projets a explorer.",
  ISTJ: "Ton profil valorise les reperes clairs, la fiabilite et le travail suivi.",
  ISFJ: "Tu sembles attentif aux autres, constant et sensible a un cadre rassurant.",
  ESTJ: "Tu avances avec organisation, sens pratique et besoin d'objectifs concrets.",
  ESFJ: "Tu sembles a l'aise dans le lien, la cooperation et les environnements bien coordonnes.",
  ISTP: "Tu privilegies souvent l'action concrete, l'observation et l'autonomie.",
  ISFP: "Tu avances avec sensibilite, discretion et attention a ce qui a du sens pour toi.",
  ESTP: "Tu sembles energise par l'action, les situations concretes et les decisions rapides.",
  ESFP: "Tu apportes presence, energie relationnelle et gout des experiences partagees.",
};

function pickTopTraits(scores: BigFiveScores): Array<[string, number]> {
  const traits: Array<[string, number]> = [
    ["ouverture", scores.openness],
    ["consciencieusite", scores.conscientiousness],
    ["extraversion", scores.extraversion],
    ["agreabilite", scores.agreeableness],
    ["sensibilite au stress", scores.neuroticism],
  ];
  return traits.sort((a, b) => b[1] - a[1]);
}

export function buildResultInterpretation(input: ResultCopyInput): ResultInterpretation {
  const topTraits = pickTopTraits(input.scores);
  const strengths: string[] = [];
  const watchPoints: string[] = [];

  if (input.scores.agreeableness >= 60) strengths.push("Relationnel cooperatif: tu peux creer un climat de confiance dans un groupe.");
  if (input.scores.extraversion >= 60) strengths.push("Energie sociale: les echanges peuvent nourrir ta motivation.");
  if (input.scores.openness >= 60) strengths.push("Curiosite: tu peux explorer plusieurs pistes avant de choisir.");
  if (input.scores.conscientiousness >= 60) strengths.push("Structure: tu sais transformer une intention en plan d'action.");
  if (input.balanceScore >= 65) strengths.push("Equilibre: tu sembles combiner organisation et recuperation avec regularite.");

  if (input.stressScore >= 65) watchPoints.push("Pression elevee: prevois des pauses visibles et des objectifs plus petits.");
  if (input.scores.neuroticism >= 65) watchPoints.push("Reactivite emotionnelle: anticipe les periodes intenses avec des routines simples.");
  if (input.scores.conscientiousness < 45) watchPoints.push("Cadre de travail: quelques reperes fixes peuvent aider a garder le cap.");
  if (input.scores.extraversion < 45) watchPoints.push("Energie sociale: garde du temps calme apres les interactions longues.");
  if (input.balanceScore < 45) watchPoints.push("Organisation: reduis la charge en priorisant une action claire a la fois.");

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
        ? "Decoupe les taches, limite les longues sessions et ajoute des pauses de recuperation."
        : "Garde une organisation legere: priorites du jour, temps de focus, puis bilan rapide.";

  const buddyHint =
    input.scores.extraversion >= 55
      ? "Un buddy calme et structure peut completer ton energie relationnelle."
      : "Un buddy encourageant et regulier peut aider a garder le lien sans te surcharger.";

  return {
    explanation: MBTI_EXPLANATIONS[input.mbtiCode] ?? `Ton profil ${input.mbtiName} donne une lecture indicative de tes preferences actuelles.`,
    strengths: strengths.slice(0, 3),
    watchPoints: watchPoints.slice(0, 3),
    workStyle,
    buddyHint,
  };
}
