export const STUDY_LEVEL_CHOICES = ["L1", "L2", "L3", "PM", "M1", "M2", "LAUREAT"] as const;

export type StudyLevel = (typeof STUDY_LEVEL_CHOICES)[number];

export function isStudyLevel(value: string): value is StudyLevel {
  return STUDY_LEVEL_CHOICES.includes(value as StudyLevel);
}
