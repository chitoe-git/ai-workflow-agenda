# Agenda Workflow MVP

Minimal full-stack scaffold for a mobile-first AI scheduler and performance journal.

## Tech
- Next.js App Router + TypeScript
- Tailwind + shadcn-style components
- Supabase (Auth + Postgres)
- OpenAI API

## Setup
1. Copy environment variables:
```bash
cp .env.example .env.local
```
2. Add real Supabase and OpenAI keys in `.env.local`.
3. Run SQL from `db/schema.sql` in Supabase SQL editor.
4. Install and run:
```bash
npm install
npm run dev
```

## Main routes
- `/dashboard` planner + execution + reflection
- `/api/schedule/generate` AI schedule generation and persistence
- `/api/checkitems/toggle` checkbox persistence
- `/api/reflections` reflection persistence

## Notes
- App expects RLS-enabled schema from `db/schema.sql`.
- `OPENAI_MODEL` defaults to `gpt-5-mini`.
- Local testing no longer requires login. Open `/dashboard` directly.
- If you already ran the schema before this update, run `db/schema.sql` again to add new reflection/performance columns.
