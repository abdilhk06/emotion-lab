import { z } from "zod";

const bigFiveSchema = z.object({
  openness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  extraversion: z.number().min(0).max(100),
  agreeableness: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
});

const planningPreferencesSchema = z
  .object({
    taskList: z.array(z.string().min(1)).optional(),
    deadline: z.string().min(1).optional(),
    availableHours: z.number().positive().optional(),
    preferredStudyTime: z.string().min(1).optional(),
    sleepConstraints: z.string().min(1).optional(),
    taskDifficulty: z.string().min(1).optional(),
    nightWorkPreference: z.enum(["yes", "no", "sometimes"]).optional(),
  })
  .optional();

export const planResponseSchema = z.object({
  summary: z.string().min(1),
  objective: z.string().min(1),
  timeframe: z.string().min(1),
  mode: z.enum(["emotional_support", "planning", "hybrid"]).optional(),
  inputGaps: z.array(z.string().min(1)).optional(),
  timeBlocks: z
    .array(
      z.object({
        day: z.string().min(1),
        start: z.string().min(1),
        end: z.string().min(1),
        focus: z.string().min(1),
        priority: z.enum(["high", "medium", "low"]),
        breakNote: z.string().min(1),
      })
    )
    .optional(),
  planSections: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        steps: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  todayChecklist: z.array(z.string().min(1)).min(1),
  weeklyPlan: z
    .array(
      z.object({
        day: z.string().min(1),
        focus: z.string().min(1),
        tasks: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  habits: z.array(z.string().min(1)).min(1),
  risks: z
    .array(
      z.object({
        risk: z.string().min(1),
        prevention: z.string().min(1),
      })
    )
    .min(1),
  nextAction: z.string().min(1),
  safetyNote: z.string().min(1),
});

export type PlannerResponse = z.infer<typeof planResponseSchema>;

export const planRequestSchema = z.object({
  message: z.string().min(1),
  context: z
    .array(
      z.object({
        role: z.enum(["user", "bot"]),
        text: z.string().min(1),
      })
    )
    .max(8)
    .default([]),
  mode: z.enum(["emotional_support", "planning", "hybrid"]).optional(),
  userContext: z
    .object({
      hasPersonalizationData: z.boolean(),
      stressScore: z.number().min(0).max(100).nullable(),
      organizationBalanceScore: z.number().min(0).max(100).nullable(),
      mbtiCode: z.string().nullable(),
      mbtiName: z.string().nullable(),
      bigFiveScores: bigFiveSchema.nullable(),
      hobbies: z.array(z.string()),
      planningPreferences: planningPreferencesSchema,
    })
    .optional(),
});
