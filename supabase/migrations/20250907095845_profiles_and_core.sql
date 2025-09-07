-- Create core enums (if needed later by other migrations)
create type public.unit_system as enum ('metric', 'imperial');

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  photo_url text,
  unit_preference public.unit_system not null default 'metric',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- On signup → insert profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, photo_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null), coalesce(new.raw_user_meta_data->>'avatar_url', null))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Enable RLS + policies
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by self" on public.profiles;
create policy "Profiles are viewable by self"
on public.profiles for select
using ( auth.uid() = id );

drop policy if exists "Profiles are updatable by self" on public.profiles;
create policy "Profiles are updatable by self"
on public.profiles for update
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- Helpful function: current user id
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select auth.uid()
$$;