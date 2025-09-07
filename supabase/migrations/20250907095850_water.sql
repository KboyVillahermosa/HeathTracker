-- Water goals per user (optional personalization)
create table if not exists public.water_goals (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_goal_ml integer not null check (daily_goal_ml > 0),
  auto_goal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Water logs
create table if not exists public.water_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0),
  logged_at timestamptz not null default now(),
  source text default 'manual', -- manual / quick-200 / quick-250 / quick-300 / integration
  created_at timestamptz not null default now()
);

create index if not exists water_logs_user_time_idx on public.water_logs (user_id, logged_at desc);

-- Reminders (basic vs premium can be enforced app-side; stored here)
create table if not exists public.water_reminders (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  time_local time not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Keep updated_at on goals
drop trigger if exists trg_water_goals_updated_at on public.water_goals;
create trigger trg_water_goals_updated_at
before update on public.water_goals
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.water_goals enable row level security;
alter table public.water_logs enable row level security;
alter table public.water_reminders enable row level security;

drop policy if exists "Read own water goals" on public.water_goals;
create policy "Read own water goals" on public.water_goals for select using (auth.uid() = user_id);
drop policy if exists "Upsert own water goals" on public.water_goals;
create policy "Upsert own water goals" on public.water_goals for insert with check (auth.uid() = user_id);
create policy "Update own water goals" on public.water_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Read own water logs" on public.water_logs;
create policy "Read own water logs" on public.water_logs for select using (auth.uid() = user_id);
drop policy if exists "Insert own water logs" on public.water_logs;
create policy "Insert own water logs" on public.water_logs for insert with check (auth.uid() = user_id);
drop policy if exists "Delete own water logs" on public.water_logs;
create policy "Delete own water logs" on public.water_logs for delete using (auth.uid() = user_id);

drop policy if exists "Read own water reminders" on public.water_reminders;
create policy "Read own water reminders" on public.water_reminders for select using (auth.uid() = user_id);
drop policy if exists "Manage own water reminders" on public.water_reminders;
create policy "Manage own water reminders" on public.water_reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);