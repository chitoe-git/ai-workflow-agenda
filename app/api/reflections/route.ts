import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reflectionSchema = z.object({
  entryId: z.string().uuid(),
  completedSummary: z.string().optional(),
  incompleteSummary: z.string().optional(),
  energyRating: z.number().int().min(1).max(10).optional(),
  moodRating: z.number().int().min(1).max(10).optional(),
  adherenceScore: z.number().int().min(1).max(10).optional(),
  deepWorkBlocksCompleted: z.number().int().min(0).optional(),
  estimationAccuracyScore: z.number().int().min(1).max(10).optional(),
  prioritiesHonoredScore: z.number().int().min(1).max(10).optional(),
  failureReasons: z.array(z.string()).optional(),
  sleepTargetHours: z.number().min(0).max(24).nullable().optional(),
  workoutTargetMinutes: z.number().int().min(0).nullable().optional(),
  shutdownRitualComplete: z.boolean().optional(),
  tomorrowTop3: z.array(z.string()).optional(),
  tomorrowNotes: z.string().optional(),
  journalHeadline: z.string().optional(),
  journalProgressNote: z.string().optional(),
  journalFrictionNote: z.string().optional(),
  journalLessonNote: z.string().optional(),
  journalIfThenPlan: z.string().optional(),
  journalGratitudeNote: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = reflectionSchema.parse(body);

    const { data: entry, error: entryError } = await supabase
      .from("daily_entries")
      .select("id")
      .eq("id", input.entryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (entryError || !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("reflection")
      .select("*")
      .eq("entry_id", input.entryId)
      .maybeSingle();

    const base = existing ?? {
      completed_summary: "",
      incomplete_summary: "",
      energy_rating: 7,
      mood_rating: 7,
      adherence_score: 7,
      deep_work_blocks_completed: 0,
      estimation_accuracy_score: 7,
      priorities_honored_score: 7,
      failure_reasons: [],
      sleep_target_hours: null,
      workout_target_minutes: null,
      shutdown_ritual_complete: false,
      tomorrow_top3: [],
      tomorrow_notes: "",
      journal_headline: "",
      journal_progress_note: "",
      journal_friction_note: "",
      journal_lesson_note: "",
      journal_if_then_plan: "",
      journal_gratitude_note: "",
      notes: ""
    };

    const { error } = await supabase.from("reflection").upsert(
      {
        entry_id: input.entryId,
        completed_summary: input.completedSummary ?? base.completed_summary,
        incomplete_summary: input.incompleteSummary ?? base.incomplete_summary,
        energy_rating: input.energyRating ?? base.energy_rating,
        mood_rating: input.moodRating ?? base.mood_rating,
        adherence_score: input.adherenceScore ?? base.adherence_score,
        deep_work_blocks_completed: input.deepWorkBlocksCompleted ?? base.deep_work_blocks_completed,
        estimation_accuracy_score: input.estimationAccuracyScore ?? base.estimation_accuracy_score,
        priorities_honored_score: input.prioritiesHonoredScore ?? base.priorities_honored_score,
        failure_reasons: input.failureReasons ?? base.failure_reasons,
        sleep_target_hours: input.sleepTargetHours !== undefined ? input.sleepTargetHours : base.sleep_target_hours,
        workout_target_minutes:
          input.workoutTargetMinutes !== undefined ? input.workoutTargetMinutes : base.workout_target_minutes,
        shutdown_ritual_complete: input.shutdownRitualComplete ?? base.shutdown_ritual_complete,
        tomorrow_top3: input.tomorrowTop3 ?? base.tomorrow_top3,
        tomorrow_notes: input.tomorrowNotes ?? base.tomorrow_notes,
        journal_headline: input.journalHeadline ?? base.journal_headline,
        journal_progress_note: input.journalProgressNote ?? base.journal_progress_note,
        journal_friction_note: input.journalFrictionNote ?? base.journal_friction_note,
        journal_lesson_note: input.journalLessonNote ?? base.journal_lesson_note,
        journal_if_then_plan: input.journalIfThenPlan ?? base.journal_if_then_plan,
        journal_gratitude_note: input.journalGratitudeNote ?? base.journal_gratitude_note,
        notes: input.notes ?? base.notes
      },
      { onConflict: "entry_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
