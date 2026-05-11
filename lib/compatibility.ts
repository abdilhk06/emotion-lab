const MBTI_COMPATIBLE_PAIRS: Record<string, string[]> = {
  ENFJ: ["INFP", "ISFP"],
  ENFP: ["INFJ", "INTJ"],
  ENTJ: ["INFP", "INTP"],
  ENTP: ["INFJ", "INTJ"],
  ESFJ: ["ISFP", "ISTP"],
  ESFP: ["ISTJ", "ISFJ"],
  ESTJ: ["ISTP", "INTP"],
  ESTP: ["ISFJ", "ISTJ"],
  INFJ: ["ENFP", "ENTP"],
  INFP: ["ENFJ", "ENTJ"],
  INTJ: ["ENFP", "ENTP"],
  INTP: ["ENTJ", "ESTJ"],
  ISFJ: ["ESFP", "ESTP"],
  ISFP: ["ENFJ", "ESFJ"],
  ISTJ: ["ESFP", "ESTP"],
  ISTP: ["ESFJ", "ESTJ"],
};

export function normalizeMbti(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return code.length === 4 ? code : null;
}

export function areMbtiCompatible(currentMbti: string | null | undefined, buddyMbti: string | null | undefined): boolean {
  const current = normalizeMbti(currentMbti);
  const buddy = normalizeMbti(buddyMbti);

  if (!current || !buddy) return false;
  if (current === buddy) return true;

  const linked = MBTI_COMPATIBLE_PAIRS[current] ?? [];
  return linked.includes(buddy);
}

export function computeBuddyCompatibilityScore(params: {
  sharedHobbiesCount: number;
  currentMbti: string | null | undefined;
  buddyMbti: string | null | undefined;
  sameStudyLevel: boolean;
}): number {
  const sharedHobbiesCount = Math.max(0, params.sharedHobbiesCount);
  const hobbyBonus = sharedHobbiesCount * 10;
  const mbtiBonus = areMbtiCompatible(params.currentMbti, params.buddyMbti) ? 20 : 0;
  const studyLevelBonus = params.sameStudyLevel ? 10 : 0;

  return Math.min(100, 40 + hobbyBonus + mbtiBonus + studyLevelBonus);
}
