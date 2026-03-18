# AI Daily Scheduler MVP Architecture

## Product Scope
- Mobile-first daily planner with AI schedule generation.
- Checklist-driven execution for plan blocks and tasks.
- End-of-day reflection to power future scheduling improvements.

## Core Layers
1. Next.js App Router UI
- `/auth` for email magic link sign-in.
- `/dashboard` for planning, schedule execution, and reflection.

2. API Layer (Route Handlers)
- `POST /api/schedule/generate`: validates form input, calls OpenAI, validates strict JSON, persists schedule.
- `PATCH /api/checkitems/toggle`: updates completion state for plan/task checkboxes.
- `POST /api/reflections`: upserts reflection for a daily entry.

3. Data Layer (Supabase)
- Postgres tables for entries, plan blocks, tasks, reflection, and future learning patterns.
- RLS policies tied to `auth.uid()` for secure per-user data access.

4. AI Generation
- OpenAI `chat.completions` with strict `json_schema` response format.
- Server-side validation with Zod and overlap checking before DB writes.

## Extensibility Decisions
- `daily_entries.raw_schedule` stores full model output for auditing and reprocessing.
- `task_patterns` and `long_term_goals` tables are included now for future adaptive scheduling.
- Unique `(user_id, entry_date)` allows regenerating a day plan without duplicate rows.
