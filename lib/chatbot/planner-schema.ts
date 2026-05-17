import { z } from "zod";

export const planResponseSchema = z.object({
  summary: z.string().min(1),
  objective: z.string().min(1),
  timeframe: z.string().min(1),
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
});
