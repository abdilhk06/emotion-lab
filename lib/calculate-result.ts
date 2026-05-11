export type AnswerValue = number | string | string[];

export type AnswersMap = Record<string, AnswerValue>;

export type BigFiveScores = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type CalculatedResult = {
  mbti_code: string;
  mbti_name: string;
  big_five_scores: BigFiveScores;
  stress_score: number;
  balance_score: number;
};

const MBTI_NAMES: Record<string, string> = {
  INTJ: "Le Strategiste",
  INTP: "Le Penseur",
  ENTJ: "Le Commandant",
  ENTP: "L'Explorateur",
  INFJ: "Le Conseiller",
  INFP: "Le Mediateur",
  ENFJ: "Le Guide",
  ENFP: "L'Inspirateur",
  ISTJ: "Le Logisticien",
  ISFJ: "Le Protecteur",
  ESTJ: "L'Organisateur",
  ESFJ: "Le Federateur",
  ISTP: "L'Analyste terrain",
  ISFP: "Le Createur sensible",
  ESTP: "Le Dynamique",
  ESFP: "L'Animateur",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLikert(value: AnswerValue | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 3;
  }
  return clamp(value, 1, 5);
}

function oneOf(value: AnswerValue | undefined, positive: string[], neutralWeight = 0): number {
  if (typeof value !== "string") return 0;
  if (positive.includes(value)) return 1;
  if (neutralWeight !== 0) return neutralWeight;
  return -1;
}

function includesAny(value: AnswerValue | undefined, positives: string[], negatives: string[]): number {
  if (!Array.isArray(value)) return 0;
  let score = 0;
  for (const item of value) {
    if (positives.includes(item)) score += 1;
    if (negatives.includes(item)) score -= 1;
  }
  return score;
}

function toPercent(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

export function calculateResult(answers: AnswersMap): CalculatedResult {
  const vitality = (normalizeLikert(answers.q01) + normalizeLikert(answers.q02)) / 2;
  const pauseRegulation = normalizeLikert(answers.q05);
  const socialEase = normalizeLikert(answers.q06);
  const support = normalizeLikert(answers.q09);
  const assertiveness = normalizeLikert(answers.q10);
  const awareness = normalizeLikert(answers.q11);
  const calmDown = normalizeLikert(answers.q12);
  const emotionalExpression = normalizeLikert(answers.q15);
  const discipline = normalizeLikert(answers.q16);
  const consistency = normalizeLikert(answers.q19);
  const motivation = normalizeLikert(answers.q20);

  const q03 = oneOf(answers.q03, ["soir"], 0);
  const q07 = oneOf(answers.q07, ["leader"], 0);
  const q13 = oneOf(answers.q13, ["defense", "silence"], 0);
  const q17 = oneOf(answers.q17, ["plan"], 0);

  const q04 = includesAny(answers.q04, ["pression", "isolement"], ["bruit", "ecrans"]);
  const q08 = includesAny(answers.q08, ["confiance", "stabilite", "profondeur"], ["humour"]);
  const q14 = includesAny(answers.q14, ["bouger", "parler"], ["ruminer", "isoler"]);
  const q18 = includesAny(answers.q18, ["lecture", "pratique"], ["video", "groupe"]);

  const extraversionRaw =
    (socialEase - 3) * 1.1 +
    (assertiveness - 3) * 0.8 +
    q07 * 0.9 +
    q03 * 0.5 +
    (q14 > 0 ? 0.35 : q14 < 0 ? -0.35 : 0);

  const opennessRaw =
    (awareness - 3) * 0.7 +
    (emotionalExpression - 3) * 0.6 +
    (q18 > 0 ? 0.6 : q18 < 0 ? -0.3 : 0) +
    (q13 < 0 ? -0.25 : 0.25);

  const conscientiousnessRaw =
    (discipline - 3) * 1.0 +
    (consistency - 3) * 1.0 +
    (pauseRegulation - 3) * 0.6 +
    q17 * 0.55 +
    (motivation - 3) * 0.45;

  const agreeablenessRaw =
    (support - 3) * 0.9 +
    (awareness - 3) * 0.4 +
    (q08 > 0 ? 0.7 : q08 < 0 ? -0.25 : 0) +
    (q13 > 0 ? -0.35 : 0.2);

  const neuroticismRaw =
    (3 - calmDown) * 1.0 +
    (3 - vitality) * 0.7 +
    (q04 > 0 ? 0.5 : q04 < 0 ? -0.2 : 0) +
    (q14 < 0 ? 0.7 : q14 > 0 ? -0.5 : 0);

  const big_five_scores: BigFiveScores = {
    openness: toPercent(50 + opennessRaw * 12),
    conscientiousness: toPercent(50 + conscientiousnessRaw * 12),
    extraversion: toPercent(50 + extraversionRaw * 12),
    agreeableness: toPercent(50 + agreeablenessRaw * 12),
    neuroticism: toPercent(50 + neuroticismRaw * 12),
  };

  const stress_score = toPercent(
    big_five_scores.neuroticism * 0.45 +
      (100 - toPercent(calmDown * 20)) * 0.35 +
      (100 - toPercent(vitality * 20)) * 0.2
  );

  const balance_score = toPercent(
    (100 - stress_score) * 0.4 +
      big_five_scores.conscientiousness * 0.25 +
      big_five_scores.agreeableness * 0.2 +
      toPercent(motivation * 20) * 0.15
  );

  const e = big_five_scores.extraversion >= 50 ? "E" : "I";
  const n = big_five_scores.openness >= 50 ? "N" : "S";
  const f = big_five_scores.agreeableness >= 50 ? "F" : "T";
  const p = big_five_scores.conscientiousness >= 50 ? "J" : "P";

  const mbti_code = `${e}${n}${f}${p}`;

  return {
    mbti_code,
    mbti_name: MBTI_NAMES[mbti_code] ?? "Profil Equilibre",
    big_five_scores,
    stress_score,
    balance_score,
  };
}
