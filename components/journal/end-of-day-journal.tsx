"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LOCAL_STORAGE_PREFIX = "agenda-journal";

type EndOfDayJournalProps = {
  entryId: string;
  entryDate: string;
  persistEnabled: boolean;
  initial?: {
    journal_headline: string;
    journal_progress_note: string;
    journal_friction_note: string;
    journal_lesson_note: string;
    journal_if_then_plan: string;
    journal_gratitude_note: string;
  } | null;
};

type JournalState = {
  journalHeadline: string;
  journalProgressNote: string;
  journalFrictionNote: string;
  journalLessonNote: string;
  journalIfThenPlan: string;
  journalGratitudeNote: string;
};

const emptyState: JournalState = {
  journalHeadline: "",
  journalProgressNote: "",
  journalFrictionNote: "",
  journalLessonNote: "",
  journalIfThenPlan: "",
  journalGratitudeNote: ""
};

export function EndOfDayJournal({ entryId, entryDate, persistEnabled, initial }: EndOfDayJournalProps) {
  const storageKey = useMemo(() => `${LOCAL_STORAGE_PREFIX}-${entryId || entryDate}`, [entryDate, entryId]);
  const [state, setState] = useState<JournalState>(() =>
    initial
      ? {
          journalHeadline: initial.journal_headline ?? "",
          journalProgressNote: initial.journal_progress_note ?? "",
          journalFrictionNote: initial.journal_friction_note ?? "",
          journalLessonNote: initial.journal_lesson_note ?? "",
          journalIfThenPlan: initial.journal_if_then_plan ?? "",
          journalGratitudeNote: initial.journal_gratitude_note ?? ""
        }
      : emptyState
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setState({
        journalHeadline: initial.journal_headline ?? "",
        journalProgressNote: initial.journal_progress_note ?? "",
        journalFrictionNote: initial.journal_friction_note ?? "",
        journalLessonNote: initial.journal_lesson_note ?? "",
        journalIfThenPlan: initial.journal_if_then_plan ?? "",
        journalGratitudeNote: initial.journal_gratitude_note ?? ""
      });
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      setState(emptyState);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as JournalState;
      setState({ ...emptyState, ...parsed });
    } catch {
      setState(emptyState);
    }
  }, [initial, storageKey]);

  function updateField(field: keyof JournalState, value: string) {
    setState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!persistEnabled) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      setMessage("Journal saved on this device.");
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
        energyRating: 7,
        moodRating: 7,
        journalHeadline: state.journalHeadline,
        journalProgressNote: state.journalProgressNote,
        journalFrictionNote: state.journalFrictionNote,
        journalLessonNote: state.journalLessonNote,
        journalIfThenPlan: state.journalIfThenPlan,
        journalGratitudeNote: state.journalGratitudeNote
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to save journal.");
      setLoading(false);
      return;
    }

    setMessage("Journal saved.");
    setLoading(false);
  }

  return (
    <Card className="p-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Journal</CardTitle>
            <CardDescription>
              A short end-of-day journal built around evidence-backed self-monitoring, obstacle review, and tomorrow
              planning.
            </CardDescription>
          </div>
          <Badge>3 min</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="journalHeadline">Headline for the day</Label>
            <Textarea
              id="journalHeadline"
              value={state.journalHeadline}
              onChange={(event) => updateField("journalHeadline", event.target.value)}
              placeholder="One honest sentence. What kind of day was this, really?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journalProgressNote">What actually moved the week forward?</Label>
            <p className="text-sm text-ink-subtle">
              Best when tied to a weekly goal, not just busyness. This keeps progress visible.
            </p>
            <Textarea
              id="journalProgressNote"
              value={state.journalProgressNote}
              onChange={(event) => updateField("journalProgressNote", event.target.value)}
              placeholder="What mattered, shipped, advanced, or was honored today?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journalFrictionNote">Where did the plan break?</Label>
            <p className="text-sm text-ink-subtle">
              Name the real friction: avoidance, low energy, interruptions, unclear next action, or bad estimation.
            </p>
            <Textarea
              id="journalFrictionNote"
              value={state.journalFrictionNote}
              onChange={(event) => updateField("journalFrictionNote", event.target.value)}
              placeholder="What got in the way, and when did it happen?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journalLessonNote">What should you repeat or change tomorrow?</Label>
            <Textarea
              id="journalLessonNote"
              value={state.journalLessonNote}
              onChange={(event) => updateField("journalLessonNote", event.target.value)}
              placeholder="One rule to keep. One thing to stop."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="journalIfThenPlan">Tomorrow if-then plan</Label>
              <p className="text-sm text-ink-subtle">
                Example: If I start scrolling after lunch, then I will set a 10-minute timer and begin task one.
              </p>
              <Textarea
                id="journalIfThenPlan"
                value={state.journalIfThenPlan}
                onChange={(event) => updateField("journalIfThenPlan", event.target.value)}
                placeholder="If [obstacle], then I will [response]."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="journalGratitudeNote">What is worth appreciating?</Label>
              <p className="text-sm text-ink-subtle">Optional. Keep it grounded, not performative.</p>
              <Textarea
                id="journalGratitudeNote"
                value={state.journalGratitudeNote}
                onChange={(event) => updateField("journalGratitudeNote", event.target.value)}
                placeholder="A person, opportunity, ability, or moment you do not want to overlook."
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save journal"}
          </Button>
          {!persistEnabled ? (
            <p className="text-xs text-ink-subtle">Local mode is active. Journal entries are saved on this device.</p>
          ) : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
