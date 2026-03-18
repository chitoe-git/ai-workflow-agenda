import { z } from "zod";

export const scheduleResponseSchema = z.object({
  title: z.string().min(1),
  plan: z.array(
    z.object({
      start: z.string().min(1),
      end: z.string().min(1),
      text: z.string().min(1)
    })
  ),
  tasks: z.array(z.string().min(1)),
  constraints: z.array(z.string().min(1)),
  carryover: z.array(z.string().min(1))
});

export type ScheduleResponse = z.infer<typeof scheduleResponseSchema>;

export const plannerInputSchema = z.object({
  entryDate: z.string().date(),
  goals: z.array(z.string().min(1)).min(1),
  tasks: z.array(z.string().min(1)).min(1),
  constraints: z.array(z.string()),
  affirmations: z.array(z.string()),
  weeklyGoals: z.array(z.string()).default([]),
  operatingSystem: z
    .object({
      fixedCommitments: z.array(z.string()).default([]),
      dailyRituals: z.array(z.string()).default([]),
      minimumStandards: z.array(z.string()).default([]),
      sequencingRules: z.array(z.string()).default([]),
      fallbackRules: z.array(z.string()).default([]),
      identityRules: z.array(z.string()).default([])
    })
    .default({
      fixedCommitments: [],
      dailyRituals: [],
      minimumStandards: [],
      sequencingRules: [],
      fallbackRules: [],
      identityRules: []
    }),
  schedulerNotes: z.string().default(""),
  timezone: z.string().min(1)
});

export type PlannerInput = z.infer<typeof plannerInputSchema>;

export type OperatingSystemProfile = {
  fixedCommitments: string[];
  dailyRituals: string[];
  minimumStandards: string[];
  sequencingRules: string[];
  fallbackRules: string[];
  identityRules: string[];
};

export type DailyEntryWithChildren = {
  id: string;
  entry_date: string;
  title: string;
  goals: string[];
  constraints: string[];
  affirmations: string[];
  carryover: string[];
  plan_blocks: {
    id: string;
    start_time: string;
    end_time: string;
    text: string;
    completed: boolean;
    position: number;
  }[];
  tasks: {
    id: string;
    text: string;
    completed: boolean;
    position: number;
    carryover: boolean;
  }[];
  reflection: {
    id: string;
    completed_summary: string;
    incomplete_summary: string;
    energy_rating: number;
    mood_rating: number;
    adherence_score: number;
    deep_work_blocks_completed: number;
    estimation_accuracy_score: number;
    priorities_honored_score: number;
    failure_reasons: string[];
    sleep_target_hours: number | null;
    workout_target_minutes: number | null;
    shutdown_ritual_complete: boolean;
    tomorrow_top3: string[];
    tomorrow_notes: string;
    journal_headline: string;
    journal_progress_note: string;
    journal_friction_note: string;
    journal_lesson_note: string;
    journal_if_then_plan: string;
    journal_gratitude_note: string;
    notes: string;
  } | null;
};
