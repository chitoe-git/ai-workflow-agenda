-- Supabase schema for AI-powered daily scheduler MVP

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null,
  goals text[] not null default '{}',
  constraints text[] not null default '{}',
  affirmations text[] not null default '{}',
  carryover text[] not null default '{}',
  raw_schedule jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.plan_blocks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.daily_entries(id) on delete cascade,
  position int not null,
  start_time time not null,
  end_time time not null,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (entry_id, position)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.daily_entries(id) on delete cascade,
  position int not null,
  text text not null,
  estimated_minutes int,
  completed boolean not null default false,
  completed_at timestamptz,
  carryover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (entry_id, position)
);

create table if not exists public.reflection (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null unique references public.daily_entries(id) on delete cascade,
  completed_summary text not null default '',
  incomplete_summary text not null default '',
  energy_rating int not null check (energy_rating between 1 and 10),
  mood_rating int not null check (mood_rating between 1 and 10),
  adherence_score int not null default 7 check (adherence_score between 1 and 10),
  deep_work_blocks_completed int not null default 0,
  estimation_accuracy_score int not null default 7 check (estimation_accuracy_score between 1 and 10),
  priorities_honored_score int not null default 7 check (priorities_honored_score between 1 and 10),
  failure_reasons text[] not null default '{}',
  sleep_target_hours numeric(4,2),
  workout_target_minutes int,
  shutdown_ritual_complete boolean not null default false,
  tomorrow_top3 text[] not null default '{}',
  tomorrow_notes text not null default '',
  journal_headline text not null default '',
  journal_progress_note text not null default '',
  journal_friction_note text not null default '',
  journal_lesson_note text not null default '',
  journal_if_then_plan text not null default '',
  journal_gratitude_note text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reflection add column if not exists adherence_score int not null default 7 check (adherence_score between 1 and 10);
alter table public.reflection add column if not exists deep_work_blocks_completed int not null default 0;
alter table public.reflection add column if not exists estimation_accuracy_score int not null default 7 check (estimation_accuracy_score between 1 and 10);
alter table public.reflection add column if not exists priorities_honored_score int not null default 7 check (priorities_honored_score between 1 and 10);
alter table public.reflection add column if not exists failure_reasons text[] not null default '{}';
alter table public.reflection add column if not exists sleep_target_hours numeric(4,2);
alter table public.reflection add column if not exists workout_target_minutes int;
alter table public.reflection add column if not exists shutdown_ritual_complete boolean not null default false;
alter table public.reflection add column if not exists tomorrow_top3 text[] not null default '{}';
alter table public.reflection add column if not exists tomorrow_notes text not null default '';
alter table public.reflection add column if not exists journal_headline text not null default '';
alter table public.reflection add column if not exists journal_progress_note text not null default '';
alter table public.reflection add column if not exists journal_friction_note text not null default '';
alter table public.reflection add column if not exists journal_lesson_note text not null default '';
alter table public.reflection add column if not exists journal_if_then_plan text not null default '';
alter table public.reflection add column if not exists journal_gratitude_note text not null default '';

create table if not exists public.long_term_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority int not null default 3 check (priority between 1 and 5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  sample_count int not null default 0,
  avg_duration_minutes numeric(8,2),
  best_start_hour int check (best_start_hour between 0 and 23),
  completion_rate numeric(5,2),
  last_seen_at timestamptz,
  unique (user_id, task_key)
);

create table if not exists public.user_operating_system (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fixed_commitments text[] not null default '{}',
  daily_rituals text[] not null default '{}',
  minimum_standards text[] not null default '{}',
  sequencing_rules text[] not null default '{}',
  fallback_rules text[] not null default '{}',
  identity_rules text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_operating_system add column if not exists fixed_commitments text[] not null default '{}';
alter table public.user_operating_system add column if not exists daily_rituals text[] not null default '{}';
alter table public.user_operating_system add column if not exists minimum_standards text[] not null default '{}';
alter table public.user_operating_system add column if not exists sequencing_rules text[] not null default '{}';
alter table public.user_operating_system add column if not exists fallback_rules text[] not null default '{}';
alter table public.user_operating_system add column if not exists identity_rules text[] not null default '{}';
alter table public.user_operating_system add column if not exists created_at timestamptz not null default now();
alter table public.user_operating_system add column if not exists updated_at timestamptz not null default now();

create index if not exists daily_entries_user_date_idx on public.daily_entries(user_id, entry_date desc);
create index if not exists plan_blocks_entry_idx on public.plan_blocks(entry_id, position);
create index if not exists tasks_entry_idx on public.tasks(entry_id, position);
create index if not exists task_patterns_user_idx on public.task_patterns(user_id, task_key);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_entries_updated on public.daily_entries;
create trigger trg_daily_entries_updated
before update on public.daily_entries
for each row execute function public.set_updated_at();

drop trigger if exists trg_reflection_updated on public.reflection;
create trigger trg_reflection_updated
before update on public.reflection
for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_updated on public.long_term_goals;
create trigger trg_goals_updated
before update on public.long_term_goals
for each row execute function public.set_updated_at();

drop trigger if exists trg_operating_system_updated on public.user_operating_system;
create trigger trg_operating_system_updated
before update on public.user_operating_system
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.plan_blocks enable row level security;
alter table public.tasks enable row level security;
alter table public.reflection enable row level security;
alter table public.long_term_goals enable row level security;
alter table public.task_patterns enable row level security;
alter table public.user_operating_system enable row level security;

create policy "profiles_owner_all"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "daily_entries_owner_all"
on public.daily_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "plan_blocks_owner_all"
on public.plan_blocks
for all
using (
  exists (
    select 1 from public.daily_entries de
    where de.id = plan_blocks.entry_id and de.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.daily_entries de
    where de.id = plan_blocks.entry_id and de.user_id = auth.uid()
  )
);

create policy "tasks_owner_all"
on public.tasks
for all
using (
  exists (
    select 1 from public.daily_entries de
    where de.id = tasks.entry_id and de.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.daily_entries de
    where de.id = tasks.entry_id and de.user_id = auth.uid()
  )
);

create policy "reflection_owner_all"
on public.reflection
for all
using (
  exists (
    select 1 from public.daily_entries de
    where de.id = reflection.entry_id and de.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.daily_entries de
    where de.id = reflection.entry_id and de.user_id = auth.uid()
  )
);

create policy "long_term_goals_owner_all"
on public.long_term_goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "task_patterns_owner_all"
on public.task_patterns
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_operating_system_owner_all"
on public.user_operating_system
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
