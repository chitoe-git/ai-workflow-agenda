# AI Workflow Agenda

AI-powered workflow planner that generates structured daily schedules based on goals, constraints, and productivity principles.

Built to help users move from planning → execution → reflection in one system.

---

## Overview

This app takes user inputs (tasks, priorities, constraints) and uses AI to generate a realistic, time-blocked daily plan. It also tracks execution and reflections to improve consistency over time.

Inspired by systems from Atomic Habits, Deep Work, and performance journaling frameworks.

---

## Features

- AI-generated daily schedules with time blocks
- Task execution tracking with checklist system
- End-of-day reflection logging
- Persistent data storage with Supabase
- Mobile-first UI for daily use

---

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database/Auth:** Supabase (Postgres + RLS)
- **AI Integration:** OpenAI API

---

## How It Works

1. User inputs tasks, goals, and constraints
2. AI generates a structured daily schedule
3. User executes tasks and tracks completion
4. Reflection data is stored to improve future planning

---

## Running Locally

```bash
cp .env.example .env.local
