"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const failureReasonOptions = [
  "Underestimated duration",
  "Low energy",
  "Unclear next action",
  "Distracted by devices",
  "Unexpected interruptions",
  "Avoidance or fear"
];

type ReflectionFormProps = {
  entryId: string;
  persistEnabled: boolean;
  initial?: {
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

export function ReflectionForm({ entryId, persistEnabled, initial }: ReflectionFormProps) {
  const [completedSummary, setCompletedSummary] = useState(initial?.completed_summary ?? "");
  const [incompleteSummary, setIncompleteSummary] = useState(initial?.incomplete_summary ?? "");
  const [energyRating, setEnergyRating] = useState(String(initial?.energy_rating ?? 7));
  const [moodRating, setMoodRating] = useState(String(initial?.mood_rating ?? 7));
  const [adherenceScore, setAdherenceScore] = useState(String(initial?.adherence_score ?? 7));
  const [deepWorkBlocksCompleted, setDeepWorkBlocksCompleted] = useState(
    String(initial?.deep_work_blocks_completed ?? 0)
  );
  const [estimationAccuracyScore, setEstimationAccuracyScore] = useState(
    String(initial?.estimation_accuracy_score ?? 7)
  );
  const [prioritiesHonoredScore, setPrioritiesHonoredScore] = useState(
    String(initial?.priorities_honored_score ?? 7)
  );
  const [failureReasons, setFailureReasons] = useState<string[]>(initial?.failure_reasons ?? []);
  const [sleepTargetHours, setSleepTargetHours] = useState(
    initial?.sleep_target_hours ? String(initial.sleep_target_hours) : "8"
  );
  const [workoutTargetMinutes, setWorkoutTargetMinutes] = useState(
    initial?.workout_target_minutes ? String(initial.workout_target_minutes) : "45"
  );
  const [shutdownRitualComplete, setShutdownRitualComplete] = useState(
    initial?.shutdown_ritual_complete ?? false
  );
  const [tomorrowTop3, setTomorrowTop3] = useState<string[]>([
    initial?.tomorrow_top3?.[0] ?? "",
    initial?.tomorrow_top3?.[1] ?? "",
    initial?.tomorrow_top3?.[2] ?? ""
  ]);
  const [tomorrowNotes, setTomorrowNotes] = useState(initial?.tomorrow_notes ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleFailureReason(value: string) {
    setFailureReasons((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function updateTomorrowTop3(index: number, value: string) {
    setTomorrowTop3((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!persistEnabled) {
      setMessage("Saved for this local session.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/reflections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entryId,
        completedSummary,
        incompleteSummary,
        energyRating: Number(energyRating),
        moodRating: Number(moodRating),
        adherenceScore: Number(adherenceScore),
        deepWorkBlocksCompleted: Number(deepWorkBlocksCompleted),
        estimationAccuracyScore: Number(estimationAccuracyScore),
        prioritiesHonoredScore: Number(prioritiesHonoredScore),
        failureReasons,
        sleepTargetHours: sleepTargetHours.trim() === "" ? null : Number(sleepTargetHours),
        workoutTargetMinutes: workoutTargetMinutes.trim() === "" ? null : Number(workoutTargetMinutes),
        shutdownRitualComplete,
        tomorrowTop3: tomorrowTop3.map((item) => item.trim()).filter(Boolean),
        tomorrowNotes,
        notes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to save reflection.");
      setLoading(false);
      return;
    }

    setMessage("Reflection saved.");
    setLoading(false);
  }

  return (
    <Card className="p-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Performance loop</CardTitle>
            <CardDescription>Score the day honestly, diagnose misses, and lock tomorrow.</CardDescription>
          </div>
          <Badge>Discipline mode</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Label>End-of-day scoring</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adherenceScore">Plan adherence (1-10)</Label>
                <Input
                  id="adherenceScore"
                  type="number"
                  min={1}
                  max={10}
                  value={adherenceScore}
                  onChange={(event) => setAdherenceScore(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deepWorkBlocksCompleted">Deep work blocks completed</Label>
                <Input
                  id="deepWorkBlocksCompleted"
                  type="number"
                  min={0}
                  value={deepWorkBlocksCompleted}
                  onChange={(event) => setDeepWorkBlocksCompleted(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimationAccuracyScore">Estimate accuracy (1-10)</Label>
                <Input
                  id="estimationAccuracyScore"
                  type="number"
                  min={1}
                  max={10}
                  value={estimationAccuracyScore}
                  onChange={(event) => setEstimationAccuracyScore(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioritiesHonoredScore">Priorities honored (1-10)</Label>
                <Input
                  id="prioritiesHonoredScore"
                  type="number"
                  min={1}
                  max={10}
                  value={prioritiesHonoredScore}
                  onChange={(event) => setPrioritiesHonoredScore(event.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Failure analysis</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {failureReasonOptions.map((reason) => {
                const active = failureReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-primary/60 bg-primary/15 text-ink"
                        : "border-line bg-panel text-ink-subtle hover:text-ink"
                    }`}
                    onClick={() => toggleFailureReason(reason)}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Recurring standards</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sleepTargetHours">Sleep target (hours)</Label>
                <Input
                  id="sleepTargetHours"
                  type="number"
                  min={0}
                  max={24}
                  step="0.5"
                  value={sleepTargetHours}
                  onChange={(event) => setSleepTargetHours(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workoutTargetMinutes">Workout target (minutes)</Label>
                <Input
                  id="workoutTargetMinutes"
                  type="number"
                  min={0}
                  value={workoutTargetMinutes}
                  onChange={(event) => setWorkoutTargetMinutes(event.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                className="h-4 w-4 rounded border-line"
                type="checkbox"
                checked={shutdownRitualComplete}
                onChange={(event) => setShutdownRitualComplete(event.target.checked)}
              />
              Shutdown ritual complete
            </label>
          </div>

          <div className="space-y-3">
            <Label>Tomorrow setup</Label>
            <div className="grid gap-2">
              <Input
                value={tomorrowTop3[0]}
                onChange={(event) => updateTomorrowTop3(0, event.target.value)}
                placeholder="Top priority #1"
              />
              <Input
                value={tomorrowTop3[1]}
                onChange={(event) => updateTomorrowTop3(1, event.target.value)}
                placeholder="Top priority #2"
              />
              <Input
                value={tomorrowTop3[2]}
                onChange={(event) => updateTomorrowTop3(2, event.target.value)}
                placeholder="Top priority #3"
              />
              <Textarea
                value={tomorrowNotes}
                onChange={(event) => setTomorrowNotes(event.target.value)}
                placeholder="Any setup notes for tomorrow morning..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="completedSummary">What got done</Label>
              <Textarea
                id="completedSummary"
                value={completedSummary}
                onChange={(event) => setCompletedSummary(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incompleteSummary">What did not get done</Label>
              <Textarea
                id="incompleteSummary"
                value={incompleteSummary}
                onChange={(event) => setIncompleteSummary(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="energyRating">Energy (1-10)</Label>
              <Input
                id="energyRating"
                type="number"
                min={1}
                max={10}
                value={energyRating}
                onChange={(event) => setEnergyRating(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moodRating">Mood (1-10)</Label>
              <Input
                id="moodRating"
                type="number"
                min={1}
                max={10}
                value={moodRating}
                onChange={(event) => setMoodRating(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save performance review"}
          </Button>
          {!persistEnabled ? (
            <p className="text-xs text-ink-subtle">Local mode is active. This review is not synced.</p>
          ) : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
