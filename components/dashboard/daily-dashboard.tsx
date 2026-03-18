"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistSection } from "@/components/dashboard/checklist-section";
import { CommandRail, RailSection } from "@/components/dashboard/command-rail";
import { EndOfDayJournal } from "@/components/journal/end-of-day-journal";
import { DailyPlannerForm } from "@/components/planner/daily-planner-form";
import { PersonalHero } from "@/components/dashboard/personal-hero";
import { ReflectionForm } from "@/components/reflection/reflection-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DailyEntryWithChildren, OperatingSystemProfile, ScheduleResponse } from "@/lib/types";

const localOperatingSystemKey = "agenda-operating-system-v1";

type DailyDashboardProps = {
  initialEntry: DailyEntryWithChildren | null;
  defaultDate: string;
  persistenceEnabled: boolean;
  initialOperatingSystem: OperatingSystemProfile;
};

export function DailyDashboard({
  initialEntry,
  defaultDate,
  persistenceEnabled,
  initialOperatingSystem
}: DailyDashboardProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [entry, setEntry] = useState(initialEntry);
  const [weeklyGoals, setWeeklyGoals] = useState<string[]>([]);
  const [weeklyGoalsDraft, setWeeklyGoalsDraft] = useState("");
  const [weeklyGoalsSavedMessage, setWeeklyGoalsSavedMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [operatingSystem, setOperatingSystem] = useState<OperatingSystemProfile>(initialOperatingSystem);
  const [activeSection, setActiveSection] = useState<RailSection>("overview");

  useEffect(() => {
    setEntry(initialEntry);
  }, [initialEntry]);

  useEffect(() => {
    const weekKey = getWeekKey(defaultDate);
    const storedGoals = window.localStorage.getItem(`agenda-weekly-goals-${weekKey}`);

    if (!storedGoals) {
      setWeeklyGoals([]);
      setWeeklyGoalsDraft("");
      return;
    }

    try {
      const parsed = JSON.parse(storedGoals) as string[];
      setWeeklyGoals(parsed);
      setWeeklyGoalsDraft(parsed.join("\n"));
    } catch {
      setWeeklyGoals([]);
      setWeeklyGoalsDraft("");
    }
  }, [defaultDate]);

  useEffect(() => {
    setOperatingSystem(initialOperatingSystem);
    if (persistenceEnabled) {
      return;
    }

    const stored = window.localStorage.getItem(localOperatingSystemKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as OperatingSystemProfile;
      setOperatingSystem({
        fixedCommitments: parsed.fixedCommitments ?? [],
        dailyRituals: parsed.dailyRituals ?? [],
        minimumStandards: parsed.minimumStandards ?? [],
        sequencingRules: parsed.sequencingRules ?? [],
        fallbackRules: parsed.fallbackRules ?? [],
        identityRules: parsed.identityRules ?? []
      });
    } catch {
      setOperatingSystem(initialOperatingSystem);
    }
  }, [initialOperatingSystem, persistenceEnabled]);

  function getWeekKey(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    return date.toISOString().slice(0, 10);
  }

  function saveWeeklyGoals() {
    const goals = weeklyGoalsDraft
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 7);

    const weekKey = getWeekKey(defaultDate);
    window.localStorage.setItem(`agenda-weekly-goals-${weekKey}`, JSON.stringify(goals));
    setWeeklyGoals(goals);
    setWeeklyGoalsDraft(goals.join("\n"));
    setWeeklyGoalsSavedMessage("Weekly goals saved.");

    window.setTimeout(() => {
      setWeeklyGoalsSavedMessage(null);
    }, 1800);
  }

  function formatTime(time: string) {
    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    const [hoursRaw = "0", minutes = "00"] = time.split(":");
    const hours = Number(hoursRaw);
    const suffix = hours >= 12 ? "PM" : "AM";
    const normalized = hours % 12 === 0 ? 12 : hours % 12;
    return `${normalized}:${minutes} ${suffix}`;
  }

  function getCompletion() {
    if (!entry) {
      return { completed: 0, total: 0, percent: 0 };
    }

    const items = [...entry.plan_blocks, ...entry.tasks];
    const completed = items.filter((item) => item.completed).length;
    const total = items.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function getTaskCompletion() {
    if (!entry) {
      return { completed: 0, total: 0, percent: 0 };
    }

    const completed = entry.tasks.filter((item) => item.completed).length;
    const total = entry.tasks.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function buildLocalEntry(args: { entryDate: string; entryId: string; schedule: ScheduleResponse }) {
    const { entryDate, entryId, schedule } = args;
    const carryoverSet = new Set(schedule.carryover.map((item) => item.toLowerCase().trim()));

    const nextEntry: DailyEntryWithChildren = {
      id: entryId,
      entry_date: entryDate,
      title: schedule.title,
      goals: [],
      constraints: schedule.constraints,
      affirmations: [],
      carryover: schedule.carryover,
      plan_blocks: schedule.plan.map((block, index) => ({
        id: `plan-${index}-${Math.random().toString(36).slice(2, 8)}`,
        start_time: block.start,
        end_time: block.end,
        text: block.text,
        completed: false,
        position: index
      })),
      tasks: schedule.tasks.map((task, index) => ({
        id: `task-${index}-${Math.random().toString(36).slice(2, 8)}`,
        text: task,
        completed: false,
        position: index,
        carryover: carryoverSet.has(task.toLowerCase().trim())
      })),
      reflection: null
    };

    setEntry(nextEntry);
  }

  async function handleToggle(params: { kind: "plan" | "task"; itemId: string; completed: boolean }) {
    if (!entry) {
      return;
    }

    setEntry((current) => {
      if (!current) {
        return current;
      }

      if (params.kind === "plan") {
        return {
          ...current,
          plan_blocks: current.plan_blocks.map((block) =>
            block.id === params.itemId ? { ...block, completed: params.completed } : block
          )
        };
      }

      return {
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === params.itemId ? { ...task, completed: params.completed } : task
        )
      };
    });

    if (!persistenceEnabled) {
      setSyncError(null);
      return;
    }

    const response = await fetch("/api/checkitems/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      setSyncError("Could not save checkbox state. Reload and try again.");
      router.refresh();
      return;
    }

    setSyncError(null);
  }

  async function handleSignOut() {
    if (!persistenceEnabled) {
      return;
    }
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const completion = getCompletion();
  const taskCompletion = getTaskCompletion();

  function jumpToSection(section: RailSection) {
    setActiveSection(section);
    document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <CommandRail activeSection={activeSection} onSelect={jumpToSection} mode="dashboard" />

      <div className="space-y-6 lg:space-y-8">
        <section id="section-overview" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            {!persistenceEnabled ? <Badge>Local mode</Badge> : <Badge>Synced mode</Badge>}
            {persistenceEnabled ? (
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : null}
          </div>
          <PersonalHero />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Card className="p-0">
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Date</p>
              <p className="mt-1 text-base font-medium text-ink">{entry?.entry_date ?? defaultDate}</p>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Completion</p>
              <p className="mt-1 text-base font-medium text-ink">{`${completion.completed}/${completion.total}`}</p>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Progress</p>
              <p className="mt-1 text-base font-medium text-ink">{`${completion.percent}%`}</p>
            </CardContent>
          </Card>
        </section>

        <Card className="p-0">
          <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-ink-subtle">Daily progress bar</p>
              <p className="text-sm text-ink">{`${completion.completed}/${completion.total} items`}</p>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-panel">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#3c7cff_0%,#8f63ff_50%,#ff4fc0_100%)] transition-all duration-300"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-subtle">
              <span>{`${completion.percent}% complete`}</span>
              <span>{`Tasks: ${taskCompletion.completed}/${taskCompletion.total}`}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div id="section-planner">
              <DailyPlannerForm
                defaultDate={defaultDate}
                persistenceEnabled={persistenceEnabled}
                weeklyGoals={weeklyGoals}
                operatingSystem={operatingSystem}
                onGenerated={buildLocalEntry}
              />
            </div>

            {entry ? (
              <div id="section-execution" className="space-y-6">
                <ChecklistSection
                  title={entry.title}
                  description="Time-blocked agenda generated from your daily inputs."
                  kind="plan"
                  items={entry.plan_blocks.map((block) => ({
                    id: block.id,
                    label: block.text,
                    subtle: `${formatTime(block.start_time)} to ${formatTime(block.end_time)}`,
                    completed: block.completed
                  }))}
                  onToggle={handleToggle}
                />

                <ChecklistSection
                  title="Tasks"
                  description="Execution list synchronized with your daily plan."
                  kind="task"
                  items={entry.tasks.map((task) => ({
                    id: task.id,
                    label: task.text,
                    subtle: task.carryover ? "Marked for carryover" : undefined,
                    completed: task.completed
                  }))}
                  onToggle={handleToggle}
                />
              </div>
            ) : (
              <Card className="p-0">
                <CardContent className="px-6 py-10 text-center">
                  <CardTitle className="text-xl">No schedule yet</CardTitle>
                  <CardDescription className="mx-auto mt-2 max-w-md">
                    Enter your goals and tasks above, then generate your first agenda for today.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card id="section-operating" className="p-0">
              <CardHeader>
                <CardTitle>Operating system</CardTitle>
                <CardDescription>
                  Keep defaults on a dedicated page so this dashboard stays focused on execution.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-ink-subtle">
                  Edit fixed commitments, rituals, and minimum standards in Operating.
                </p>
                <Button type="button" onClick={() => router.push("/operating")}>
                  Open operating system
                </Button>
              </CardContent>
            </Card>

            <Card id="section-goals" className="p-0">
              <CardHeader>
                <CardTitle>Weekly goals</CardTitle>
                <CardDescription>
                  Enter outcomes for this week. The scheduler uses these goals to guide daily priorities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={weeklyGoalsDraft}
                  onChange={(event) => setWeeklyGoalsDraft(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={"Launch planner v1\n7.5h sleep average\nWorkout 4 sessions\nShip 3 priority features"}
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-subtle">
                    Saved per week (Monday start). Up to 7 goal lines.
                  </p>
                  <Button type="button" size="sm" onClick={saveWeeklyGoals}>
                    Save weekly goals
                  </Button>
                </div>
                {weeklyGoalsSavedMessage ? (
                  <p className="text-xs text-[hsl(var(--accent-cyan))]">{weeklyGoalsSavedMessage}</p>
                ) : null}
              </CardContent>
            </Card>

            {entry?.carryover?.length ? (
              <Card className="p-0">
                <CardHeader>
                  <CardTitle>Carryover</CardTitle>
                  <CardDescription>Items moved forward to keep your plan realistic.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {entry.carryover.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {entry ? (
              <>
                <div id="section-journal">
                  <EndOfDayJournal
                    entryId={entry.id}
                    entryDate={entry.entry_date}
                    persistEnabled={persistenceEnabled}
                    initial={entry.reflection}
                  />
                </div>
                <ReflectionForm entryId={entry.id} persistEnabled={persistenceEnabled} initial={entry.reflection} />
              </>
            ) : (
              <Card id="section-journal" className="p-0">
                <CardHeader>
                  <CardTitle>Journal</CardTitle>
                  <CardDescription>
                    Generate a schedule first, then the journal and reflection loop will appear here.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card className="p-0">
              <CardHeader>
                <CardTitle>Automation</CardTitle>
                <CardDescription>
                  The workflow engine runs quietly in the background and only surfaces useful state.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                  <span className="text-sm text-ink">Schedule generation</span>
                  <Badge>Ready</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                  <span className="text-sm text-ink">Sync status</span>
                  <Badge>{persistenceEnabled ? "Connected" : "Local session"}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {syncError ? (
          <Card className="border-red-500/30 bg-red-500/10 p-0">
            <CardContent className="px-4 py-3 text-sm text-red-300">{syncError}</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
