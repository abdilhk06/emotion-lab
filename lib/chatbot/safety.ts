const CRISIS_PATTERNS = [
  /suicide/i,
  /me tuer/i,
  /self\s*harm/i,
  /automutil/i,
  /je veux mourir/i,
  /envie de mourir/i,
  /urgent danger/i,
  /je vais me faire du mal/i,
  /overdose/i,
  /kill myself/i,
];

export const LOCAL_CRISIS_RESPONSE =
  "Je suis desole·e que tu traverses ca. Je ne peux pas aider en situation de crise. Si tu es en danger immediat, appelle les urgences locales maintenant. Aux Etats-Unis/Canada: 988 (Suicide & Crisis Lifeline). En France: 3114. Contacte aussi une personne de confiance pres de toi tout de suite.";

export function isCrisisMessage(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}
