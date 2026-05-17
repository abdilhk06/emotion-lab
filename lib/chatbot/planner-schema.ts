import { z } from "zod";

export const bigFiveSchema = z.object({
  openness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  extraversion: z.number().min(0).max(100),
  agreeableness: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
}).strict();

const planTaskSchema = z.object({
  title: z.string().trim().min(1),
  durationMinutes: z.number().int().positive().optional(),
  deadline: z.string().trim().min(1).optional(),
  importance: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
}).strict();

export const planResponseSchema = z.object({
  synthese: z.object({
    nb_taches: z.number().int().nonnegative(),
    deadline_globale: z.string().min(1),
    duree_planning_jours: z.number().int().positive(),
    charge_totale_minutes: z.number().int().nonnegative(),
    methode_recommandee: z.string().min(1),
  }).strict(),
  planning: z.array(
    z.object({
      date: z.string().min(1),
      jour: z.string().min(1),
      heure_debut: z.string().min(1),
      heure_fin: z.string().min(1),
      duree_min: z.number().int().positive(),
      tache: z.string().min(1),
      type: z.string().min(1),
      importance: z.string().min(1),
      methode: z.string().min(1),
      conseil: z.string().min(1),
    }).strict()
  ),
  conseils_generaux: z.array(z.string().min(1)),
  actions_suggerees: z.array(z.enum(["regenerate", "edit_task", "add_task", "export_pdf"])),
}).strict();

export type PlannerResponse = z.infer<typeof planResponseSchema>;

export const alertResponseSchema = z.object({
  type: z.literal("alerte_securite"),
  redirect: z.literal("ressources_urgence"),
}).strict();

export type PlannerAlertResponse = z.infer<typeof alertResponseSchema>;

export const planRequestSchema = z
  .object({
    taskCount: z.number().int().positive().max(50),
    globalDeadline: z.string().trim().min(1),
    todayDate: z.string().trim().min(1).optional(),
    tasks: z.array(planTaskSchema).min(1).max(50),
  })
  .strict()
  .refine((value) => value.taskCount === value.tasks.length, {
    message: "taskCount doit correspondre au nombre de taches.",
    path: ["taskCount"],
  });

export type PlannerRequest = z.infer<typeof planRequestSchema>;
export type PlannerTask = z.infer<typeof planTaskSchema>;
