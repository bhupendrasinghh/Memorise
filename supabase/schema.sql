-- ==============================================================================
-- Tracker App: Complete Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  daily_study_target_minutes integer default 120,
  streak_days integer default 0,
  last_active_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TOPICS & NOTES TABLE
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text not null,
  content text default '',
  tags text[] default '{}',
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  initial_study_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. REVISION SCHEDULES TABLE (Spaced Repetition: Day 1, 3, 7, 15, 30, 60)
create table if not exists public.revisions (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  step integer not null check (step between 1 and 6),
  interval_days integer not null check (interval_days in (1, 3, 7, 15, 30, 60)),
  scheduled_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'overdue', 'skipped')),
  completed_at timestamp with time zone,
  rating text check (rating in ('again', 'hard', 'good', 'easy')),
  notes text default ''
);

-- 4. TASKS TABLE (Daily, Weekly, Monthly)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  type text not null check (type in ('daily', 'weekly', 'monthly')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  category text not null check (category in ('Study', 'Revision', 'Project', 'Personal', 'Work')),
  deadline date not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  subtasks jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- 5. STUDY ALARMS TABLE
create table if not exists public.study_alarms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  time text not null, -- HH:mm 24-hr format
  days integer[] default '{}', -- 0=Sun, 1=Mon, ..., 6=Sat
  enabled boolean default true,
  sound text default 'chime' check (sound in ('bell', 'chime', 'digital', 'gong')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. FOCUS SESSIONS (Stopwatch / Pomodoro / Countdown history)
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text,
  topic_title text,
  duration_seconds integer not null,
  type text not null check (type in ('pomodoro', 'stopwatch', 'countdown')),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text default ''
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can ONLY access and modify their OWN data!
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.revisions enable row level security;
alter table public.tasks enable row level security;
alter table public.study_alarms enable row level security;
alter table public.study_sessions enable row level security;

-- Profiles: Users can view and update only their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Topics: Users can select, insert, update, delete only their own topics
create policy "Users manage own topics" on public.topics
  for all using (auth.uid() = user_id);

-- Revisions: Users manage their own revision schedules
create policy "Users manage own revisions" on public.revisions
  for all using (auth.uid() = user_id);

-- Tasks: Users manage their own tasks
create policy "Users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Alarms: Users manage their own alarms
create policy "Users manage own alarms" on public.study_alarms
  for all using (auth.uid() = user_id);

-- Sessions: Users manage their own focus study sessions
create policy "Users manage own sessions" on public.study_sessions
  for all using (auth.uid() = user_id);

-- 7. ATOMIC APP STATE TABLE (For Instant Cross-Device Sync)
create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.app_state enable row level security;
create policy "Allow all authenticated and anon access to app_state" on public.app_state
  for all using (true) with check (true);
