import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { diagnosePlan, hasPlanOverlap, repairPlanOverlaps } from "@/lib/scheduling";
import { getOpenAIClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { plannerInputSchema, scheduleResponseSchema } from "@/lib/types";

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  lines
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      results.push(line);
    });

  return results;
}

function toSqlTime(input: string) {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    throw new Error(`Invalid time format: ${input}`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  let convertedHour = hour % 12;
  if (meridiem === "PM") {
    convertedHour += 12;
  }

  return `${String(convertedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function buildPlannerContext(input: z.infer<typeof plannerInputSchema>) {
  const hardConstraints = uniqueLines([...input.constraints, ...input.operatingSystem.fixedCommitments]);
  const minimumStandards = uniqueLines(input.operatingSystem.minimumStandards);
  const rituals = uniqueLines(input.operatingSystem.dailyRituals);
  const sequencingRules = uniqueLines(input.operatingSystem.sequencingRules);
  const fallbackRules = uniqueLines(input.operatingSystem.fallbackRules);
  const identityRules = uniqueLines(input.operatingSystem.identityRules);

  return {
    hardConstraints,
    minimumStandards,
    rituals,
    sequencingRules,
    fallbackRules,
    identityRules
  };
}

function buildPrompt(input: z.infer<typeof plannerInputSchema>) {
  const context = buildPlannerContext(input);

  return `Create a realistic, high-performance, time-blocked daily plan.

Date: ${input.entryDate}
Timezone: ${input.timezone}
Goals:\n${input.goals.map((goal) => `- ${goal}`).join("\n")}
Tasks:\n${input.tasks.map((task) => `- ${task}`).join("\n")}
Hard Constraints:\n${context.hardConstraints.map((constraint) => `- ${constraint}`).join("\n") || "- none"}
Minimum Standards:\n${context.minimumStandards.map((item) => `- ${item}`).join("\n") || "- none"}
Daily Rituals:\n${context.rituals.map((item) => `- ${item}`).join("\n") || "- none"}
Sequencing Rules:\n${context.sequencingRules.map((item) => `- ${item}`).join("\n") || "- none"}
Fallback Rules:\n${context.fallbackRules.map((item) => `- ${item}`).join("\n") || "- none"}
Identity Rules:\n${context.identityRules.map((item) => `- ${item}`).join("\n") || "- none"}
Affirmations:\n${input.affirmations.map((line) => `- ${line}`).join("\n") || "- none"}
Weekly Goals:\n${input.weeklyGoals.map((goal) => `- ${goal}`).join("\n") || "- none"}
Scheduler Notes:\n${input.schedulerNotes.trim() || "- none"}

Rules:
- Follow this order: (1) place hard constraints, (2) place rituals around hard constraints, (3) protect minimum standards,
  (4) schedule goal-aligned tasks, (5) move overflow to carryover.
- Never violate hard constraints.
- No overlapping plan blocks.
- Use realistic durations with 5-15 minute buffers.
- Prioritize goal-aligned work and avoid overpacking.
- Focus-heavy blocks earlier when possible.
- If overload occurs, apply fallback rules and move excess to carryover.
- If tasks do not fit, move them to carryover.
- Use strict 12-hour time with AM/PM.
- Constraints in output must include all hard constraints used.

Return JSON only with this exact shape:
{
  "title": string,
  "plan": [{ "start": string, "end": string, "text": string }],
  "tasks": string[],
  "constraints": string[],
  "carryover": string[]
}`;
}

async function generateSchedule(
  openai: ReturnType<typeof getOpenAIClient>,
  model: string,
  prompt: string,
  extraSystemRules?: string
) {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an elite scheduling assistant. Return strict JSON only with no markdown and no extra text."
      },
      ...(extraSystemRules ? [{ role: "system" as const, content: extraSystemRules }] : []),
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_schedule",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            plan: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  start: { type: "string" },
                  end: { type: "string" },
                  text: { type: "string" }
                },
                required: ["start", "end", "text"]
              }
            },
            tasks: {
              type: "array",
              items: { type: "string" }
            },
            constraints: {
              type: "array",
              items: { type: "string" }
            },
            carryover: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["title", "plan", "tasks", "constraints", "carryover"]
        }
      }
    }
  });

  const rawText = completion.choices[0]?.message?.content;
  if (!rawText) {
    return null;
  }

  return scheduleResponseSchema.parse(JSON.parse(rawText));
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const body = await request.json();
    const input = plannerInputSchema.parse(body);
    const env = getServerEnv();
    const openai = getOpenAIClient();
    const prompt = buildPrompt(input);
    const planningContext = buildPlannerContext(input);

    const firstPass = await generateSchedule(openai, env.OPENAI_MODEL, prompt);
    if (!firstPass) {
      return NextResponse.json({ error: "No schedule returned from model" }, { status: 502 });
    }

    let parsedSchedule = firstPass;

    if (hasPlanOverlap(parsedSchedule.plan)) {
      const repaired = repairPlanOverlaps(parsedSchedule.plan);
      if (repaired?.plan?.length) {
        parsedSchedule = {
          ...parsedSchedule,
          plan: repaired.plan
        };
      }
    }

    if (hasPlanOverlap(parsedSchedule.plan)) {
      const secondPass = await generateSchedule(
        openai,
        env.OPENAI_MODEL,
        prompt,
        "Previous attempt had time overlaps. Rebuild the schedule and enforce non-overlapping blocks with strict hard constraints."
      );

      if (secondPass) {
        parsedSchedule = secondPass;
        if (hasPlanOverlap(parsedSchedule.plan)) {
          const repaired = repairPlanOverlaps(parsedSchedule.plan);
          if (repaired?.plan?.length) {
            parsedSchedule = {
              ...parsedSchedule,
              plan: repaired.plan
            };
          }
        }
      }
    }

    const mergedConstraints = uniqueLines([...planningContext.hardConstraints, ...parsedSchedule.constraints]);
    parsedSchedule = {
      ...parsedSchedule,
      constraints: mergedConstraints
    };

    if (hasPlanOverlap(parsedSchedule.plan)) {
      const diagnosis = diagnosePlan(parsedSchedule.plan);
      return NextResponse.json(
        {
          error: "Model returned invalid time overlaps. Try again.",
          errorType: "schedule_conflict",
          diagnosis,
          debug: {
            hardConstraintsCount: planningContext.hardConstraints.length,
            secondPassAttempted: true
          }
        },
        { status: 422 }
      );
    }

    if (!user) {
      return NextResponse.json({
        entryId: `local-${crypto.randomUUID()}`,
        persisted: false,
        schedule: parsedSchedule
      });
    }

    const { data: entryData, error: entryError } = await supabase
      .from("daily_entries")
      .upsert(
        {
          user_id: user.id,
          entry_date: input.entryDate,
          title: parsedSchedule.title,
          goals: input.goals,
          constraints: parsedSchedule.constraints,
          affirmations: input.affirmations,
          carryover: parsedSchedule.carryover,
          raw_schedule: parsedSchedule
        },
        { onConflict: "user_id,entry_date" }
      )
      .select("id")
      .single();

    if (entryError || !entryData) {
      return NextResponse.json({ error: entryError?.message ?? "Failed to save entry" }, { status: 500 });
    }

    const entryId = entryData.id;

    await supabase.from("plan_blocks").delete().eq("entry_id", entryId);
    await supabase.from("tasks").delete().eq("entry_id", entryId);

    const planRows = parsedSchedule.plan.map((block, index) => ({
      entry_id: entryId,
      position: index,
      start_time: toSqlTime(block.start),
      end_time: toSqlTime(block.end),
      text: block.text,
      completed: false
    }));

    const carryoverSet = new Set(parsedSchedule.carryover.map((item) => item.toLowerCase().trim()));
    const taskRows = parsedSchedule.tasks.map((task, index) => ({
      entry_id: entryId,
      position: index,
      text: task,
      completed: false,
      carryover: carryoverSet.has(task.toLowerCase().trim())
    }));

    if (planRows.length) {
      const { error: planError } = await supabase.from("plan_blocks").insert(planRows);
      if (planError) {
        return NextResponse.json({ error: planError.message }, { status: 500 });
      }
    }

    if (taskRows.length) {
      const { error: taskError } = await supabase.from("tasks").insert(taskRows);
      if (taskError) {
        return NextResponse.json({ error: taskError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ entryId, persisted: true, schedule: parsedSchedule });
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
