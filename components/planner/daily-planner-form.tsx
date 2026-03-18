"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatingSystemProfile, ScheduleResponse } from "@/lib/types";
import { linesToArray } from "@/lib/utils";

type DailyPlannerFormProps = {
  defaultDate: string;
  persistenceEnabled: boolean;
  weeklyGoals: string[];
  operatingSystem: OperatingSystemProfile;
  onGenerated: (args: { entryDate: string; schedule: ScheduleResponse; entryId: string }) => void;
};

export function DailyPlannerForm({
  defaultDate,
  persistenceEnabled,
  weeklyGoals,
  operatingSystem,
  onGenerated
}: DailyPlannerFormProps) {
  type ScheduleDiagnosis = {
    invalidBlocks: { index: number; start: string; end: string; text: string; reason: string }[];
    overlaps: { firstIndex: number; secondIndex: number; firstRange: string; secondRange: string }[];
    canAutoRepair: boolean;
  };

  const router = useRouter();
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [goals, setGoals] = useState("");
  const [tasks, setTasks] = useState("");
  const [constraints, setConstraints] = useState("");
  const [affirmations, setAffirmations] = useState("");
  const [schedulerNotes, setSchedulerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<ScheduleDiagnosis | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const goalsArray = linesToArray(goals);
    const tasksArray = linesToArray(tasks);

    if (!goalsArray.length || !tasksArray.length) {
      setError("Please add at least one goal and one task.");
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnosis(null);

    const response = await fetch("/api/schedule/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entryDate,
        goals: goalsArray,
        tasks: tasksArray,
        constraints: linesToArray(constraints),
        affirmations: linesToArray(affirmations),
        weeklyGoals,
        operatingSystem,
        schedulerNotes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Failed to generate schedule.");
      if (data.errorType === "schedule_conflict" && data.diagnosis) {
        setDiagnosis(data.diagnosis as ScheduleDiagnosis);
      }
      setLoading(false);
      return;
    }

    onGenerated({
      entryDate,
      schedule: data.schedule,
      entryId: data.entryId
    });

    setLoading(false);
    setGoals("");
    setTasks("");
    setConstraints("");
    setAffirmations("");

    if (persistenceEnabled) {
      router.refresh();
    }
  }

  return (
    <Card className="p-0">
      <CardHeader>
        <CardTitle className="text-2xl">Build today&apos;s plan</CardTitle>
        <CardDescription>
          Add goals and constraints. The scheduler will draft a calm, realistic time-blocked agenda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                required
              />
            </div>
            <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-xs text-ink-subtle">
              Automation status
              <p className="mt-1 text-sm text-ink">Planner is ready to generate a schedule.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals (one per line)</Label>
            <p className="text-xs text-ink-subtle">
              Outcomes that matter today. Write what must be true by end of day.
            </p>
            <Textarea
              id="goals"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder={"Deep work sprint\nHealth movement\nAdmin cleanup"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tasks">Tasks (one per line)</Label>
            <p className="text-xs text-ink-subtle">
              Concrete actions that move goals. Each line should be executable.
            </p>
            <Textarea
              id="tasks"
              value={tasks}
              onChange={(event) => setTasks(event.target.value)}
              placeholder={"Draft client brief\nReply to inbox\nReview notes"}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="constraints">Constraints (one per line)</Label>
              <p className="text-xs text-ink-subtle">
                Fixed commitments your schedule must obey, like class, work, and appointments.
              </p>
              <Textarea
                id="constraints"
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
                placeholder={"Meeting 1:00 PM-2:00 PM\nGym 5:30 PM-6:30 PM"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affirmations">Affirmations (optional)</Label>
              <p className="text-xs text-ink-subtle">
                Optional mindset cue. Keep it short and actionable.
              </p>
              <Textarea
                id="affirmations"
                value={affirmations}
                onChange={(event) => setAffirmations(event.target.value)}
                placeholder={"Move with focus. Keep it simple."}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedulerNotes">Scheduling adjustment notes (optional)</Label>
            <p className="text-xs text-ink-subtle">
              Use this when generation fails: say what must move first, what can be shorter, or what should be
              carryover.
            </p>
            <Textarea
              id="schedulerNotes"
              value={schedulerNotes}
              onChange={(event) => setSchedulerNotes(event.target.value)}
              placeholder={
                "Keep trade block fixed. If overloaded, shorten admin and move non-urgent tasks to carryover."
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-subtle">
              {persistenceEnabled
                ? "Changes sync to your account."
                : "Local mode: data stays in this browser session."}
            </p>
            <Button type="submit" className="min-w-44" disabled={loading}>
              {loading ? "Generating..." : "Generate schedule"}
            </Button>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {diagnosis ? (
            <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="font-medium text-red-100">Schedule diagnosis</p>
              {diagnosis.invalidBlocks.length ? (
                <div className="space-y-1">
                  <p className="text-red-100">Invalid time blocks:</p>
                  {diagnosis.invalidBlocks.map((block) => (
                    <p key={`${block.index}-${block.start}-${block.end}`}>
                      {`#${block.index + 1}: ${block.start}-${block.end} (${block.reason})`}
                    </p>
                  ))}
                </div>
              ) : null}
              {diagnosis.overlaps.length ? (
                <div className="space-y-1">
                  <p className="text-red-100">Overlapping blocks:</p>
                  {diagnosis.overlaps.map((item) => (
                    <p key={`${item.firstIndex}-${item.secondIndex}`}>
                      {`#${item.firstIndex + 1} ${item.firstRange} overlaps #${item.secondIndex + 1} ${item.secondRange}`}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-red-200/90">
                Add adjustment notes above and retry. If this repeats with valid inputs, it is a backend model-output
                issue, not your data.
              </p>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
