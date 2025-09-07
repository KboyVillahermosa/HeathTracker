-- Medicine base table
create table if not exists public.medicines (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text,                -- e.g., '500mg'
  as_needed boolean not null default false,
  total_pills integer,        -- for refills tracking
  remaining_pills integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Schedules (supports basic + advanced)
create type public.medicine_schedule_type as enum (
  'once_daily',
  'specific_times',    -- times[] in local
  'every_x_hours',
  'weekly_pattern',    -- days_of_week[]
  'every_n_days'
);

create table if not exists public.medicine_schedules (
  id bigserial primary key,
  medicine_id bigint not null references public.medicines(id) on delete cascade,
  schedule_type public.medicine_schedule_type not null,
  -- generic fields to support multiple schedule strategies
  times_local time[],          -- for specific_times or once_daily (1 item)
  every_x_hours integer,       -- for every_x_hours
  days_of_week int[],          -- 0-6 Sun-Sat
  every_n_days integer,        -- for every_n_days
  start_date date,
  end_date date,
  next_due timestamptz,        -- computed by worker/app
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events log (taken / missed / snoozed / skipped)
create type public.medicine_event_type as enum ('taken', 'missed', 'snoozed', 'skipped');

create table if not exists public.medicine_events (
  id bigserial primary key,
  medicine_id bigint not null references public.medicines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.medicine_event_type not null,
  event_time timestamptz not null default now(),
  meta jsonb, -- e.g., { "snooze_minutes":10, "reason":"travel" }
  created_at timestamptz not null default now()
);

create index if not exists medicine_events_user_time_idx on public.medicine_events (user_id, event_time desc);

-- Triggers for updated_at
drop trigger if exists trg_medicines_updated_at on public.medicines;
create trigger trg_medicines_updated_at
before update on public.medicines
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_medicine_schedules_updated_at on public.medicine_schedules;
create trigger trg_medicine_schedules_updated_at
before update on public.medicine_schedules
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.medicines enable row level security;
alter table public.medicine_schedules enable row level security;
alter table public.medicine_events enable row level security;

-- Policies: medicines
drop policy if exists "Read own medicines" on public.medicines;
create policy "Read own medicines" on public.medicines for select using (auth.uid() = user_id);
drop policy if exists "Manage own medicines" on public.medicines;
create policy "Manage own medicines" on public.medicines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: schedules (via join through medicine ownership)
drop policy if exists "Read schedules via owner" on public.medicine_schedules;
create policy "Read schedules via owner" on public.medicine_schedules for select using (
  exists (select 1 from public.medicines m where m.id = medicine_id and m.user_id = auth.uid())
);
drop policy if exists "Manage schedules via owner" on public.medicine_schedules;
create policy "Manage schedules via owner" on public.medicine_schedules for all using (
  exists (select 1 from public.medicines m where m.id = medicine_id and m.user_id = auth.uid())
) with check (
  exists (select 1 from public.medicines m where m.id = medicine_id and m.user_id = auth.uid())
);

-- Policies: events
drop policy if exists "Read own medicine events" on public.medicine_events;
create policy "Read own medicine events" on public.medicine_events for select using (auth.uid() = user_id);
drop policy if exists "Insert own medicine events" on public.medicine_events;
create policy "Insert own medicine events" on public.medicine_events for insert with check (auth.uid() = user_id);