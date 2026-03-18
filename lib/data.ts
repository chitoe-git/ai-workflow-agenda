import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DailyEntryWithChildren, OperatingSystemProfile } from "@/lib/types";

function normalizeEntry(raw: any): DailyEntryWithChildren {
  return {
    id: raw.id,
    entry_date: raw.entry_date,
    title: raw.title,
    goals: raw.goals ?? [],
    constraints: raw.constraints ?? [],
    affirmations: raw.affirmations ?? [],
    carryover: raw.carryover ?? [],
    plan_blocks: (raw.plan_blocks ?? []).sort((a: any, b: any) => a.position - b.position),
    tasks: (raw.tasks ?? []).sort((a: any, b: any) => a.position - b.position),
    reflection: raw.reflection?.[0]
        ? {
          id: raw.reflection[0].id,
          completed_summary: raw.reflection[0].completed_summary,
          incomplete_summary: raw.reflection[0].incomplete_summary,
          energy_rating: raw.reflection[0].energy_rating,
          mood_rating: raw.reflection[0].mood_rating,
          adherence_score: raw.reflection[0].adherence_score ?? 7,
          deep_work_blocks_completed: raw.reflection[0].deep_work_blocks_completed ?? 0,
          estimation_accuracy_score: raw.reflection[0].estimation_accuracy_score ?? 7,
          priorities_honored_score: raw.reflection[0].priorities_honored_score ?? 7,
          failure_reasons: raw.reflection[0].failure_reasons ?? [],
          sleep_target_hours: raw.reflection[0].sleep_target_hours ?? null,
          workout_target_minutes: raw.reflection[0].workout_target_minutes ?? null,
          shutdown_ritual_complete: raw.reflection[0].shutdown_ritual_complete ?? false,
          tomorrow_top3: raw.reflection[0].tomorrow_top3 ?? [],
          tomorrow_notes: raw.reflection[0].tomorrow_notes ?? "",
          journal_headline: raw.reflection[0].journal_headline ?? "",
          journal_progress_note: raw.reflection[0].journal_progress_note ?? "",
          journal_friction_note: raw.reflection[0].journal_friction_note ?? "",
          journal_lesson_note: raw.reflection[0].journal_lesson_note ?? "",
          journal_if_then_plan: raw.reflection[0].journal_if_then_plan ?? "",
          journal_gratitude_note: raw.reflection[0].journal_gratitude_note ?? "",
          notes: raw.reflection[0].notes
        }
      : null
  };
}

export async function getEntryForDate(userId: string, entryDate: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_entries")
    .select(
      "id, entry_date, title, goals, constraints, affirmations, carryover, plan_blocks(id, start_time, end_time, text, completed, position), tasks(id, text, completed, position, carryover), reflection(id, completed_summary, incomplete_summary, energy_rating, mood_rating, adherence_score, deep_work_blocks_completed, estimation_accuracy_score, priorities_honored_score, failure_reasons, sleep_target_hours, workout_target_minutes, shutdown_ritual_complete, tomorrow_top3, tomorrow_notes, journal_headline, journal_progress_note, journal_friction_note, journal_lesson_note, journal_if_then_plan, journal_gratitude_note, notes)"
    )
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeEntry(data);
}

export async function getLatestEntry(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_entries")
    .select(
      "id, entry_date, title, goals, constraints, affirmations, carryover, plan_blocks(id, start_time, end_time, text, completed, position), tasks(id, text, completed, position, carryover), reflection(id, completed_summary, incomplete_summary, energy_rating, mood_rating, adherence_score, deep_work_blocks_completed, estimation_accuracy_score, priorities_honored_score, failure_reasons, sleep_target_hours, workout_target_minutes, shutdown_ritual_complete, tomorrow_top3, tomorrow_notes, journal_headline, journal_progress_note, journal_friction_note, journal_lesson_note, journal_if_then_plan, journal_gratitude_note, notes)"
    )
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeEntry(data);
}

export async function getOperatingSystemProfile(userId: string): Promise<OperatingSystemProfile> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("user_operating_system")
    .select(
      "fixed_commitments, daily_rituals, minimum_standards, sequencing_rules, fallback_rules, identity_rules"
    )
    .eq("user_id", userId)
    .maybeSingle();

  return {
    fixedCommitments: data?.fixed_commitments ?? [],
    dailyRituals: data?.daily_rituals ?? [],
    minimumStandards: data?.minimum_standards ?? [],
    sequencingRules: data?.sequencing_rules ?? [],
    fallbackRules: data?.fallback_rules ?? [],
    identityRules: data?.identity_rules ?? []
  };
}
