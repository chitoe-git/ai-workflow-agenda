You are my senior full-stack engineer. Build a production-minded MVP web app called **Agenda Workflow**.

## Product Goal
Build a mobile-first AI-powered daily scheduler + performance journal that replaces a brittle n8n flow.

## What already worked in n8n (must be preserved in code)
- Form input for goals/tasks/constraints
- LLM schedule generation with strict JSON
- JSON parsing
- Writing structured data to storage
- Rendering checkbox-like plan and task items

## Stack (required)
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui patterns/components
- Supabase (Auth + Postgres)
- OpenAI API for schedule generation

## UX / Visual Direction
- Mobile-first, premium, minimal, motivating.
- Soft rounded corners.
- Clean “liquid glass” depth: subtle blur, translucent cards, layered surfaces, lightweight shadows.
- Avoid generic boilerplate look.
- Keep interface calm and high-clarity.

## MVP Features
1. Daily planning form fields:
- goals
- tasks
- constraints
- optional affirmations

2. AI schedule generation from form inputs.

3. Save generated schedule and source inputs in Supabase.

4. Dashboard rendering with:
- title
- plan section (checkboxes)
- task section (checkboxes)

5. Reflection flow with DB write:
- what got done
- what did not
- energy/mood
- notes

6. Data model must support future learning:
- task duration patterns
- best time-of-day by task type
- long-term goals

## LLM Output Contract
The model must return strict JSON only (no markdown, no extra text) with exact shape:

{
  "title": string,
  "plan": [{ "start": string, "end": string, "text": string }],
  "tasks": string[],
  "constraints": string[],
  "carryover": string[]
}

## Scheduling Rules
- Respect constraints as fixed commitments.
- No overlapping plan blocks.
- Realistic durations.
- Add short buffers.
- Prioritize goal-aligned work.
- Avoid overpacking.
- Move overflow tasks to `carryover`.

## Build Requirements
- Use server-side validation (Zod) for inputs and model output.
- Enforce strict JSON schema in OpenAI call.
- Reject invalid schedules (e.g., overlaps or malformed times).
- Add clean, typed API routes.
- Keep code modular and easy to iterate.
- Include concise comments only where they materially clarify complex logic.

## Deliverables (in order)
1. Architecture summary.
2. Folder structure.
3. Supabase SQL schema with RLS policies.
4. Working scaffold with:
- auth page
- daily planner form
- AI generation route
- dashboard with checkboxes
- reflection form

5. Environment setup instructions.
6. Brief explanation of each major file created.

## Output Style
- Be direct and practical.
- Show exact file paths for created files.
- Prefer production-minded defaults over quick hacks.
- If a tradeoff exists, choose the more extensible option and state why.
