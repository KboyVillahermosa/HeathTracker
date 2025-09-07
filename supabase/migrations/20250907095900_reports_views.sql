-- View: water intake per day (last 90 days)
create or replace view public.v_water_daily as
select
  wl.user_id,
  date_trunc('day', wl.logged_at) as day,
  sum(wl.amount_ml) as total_ml
from public.water_logs wl
group by 1,2;

-- View: medicine adherence per day (last 90 days)
create or replace view public.v_medicine_adherence_daily as
with taken as (
  select user_id, date_trunc('day', event_time) as day, count(*) as taken_count
  from public.medicine_events
  where event_type = 'taken'
  group by 1,2
),
expected as (
  -- naive expectation: count of due doses derived from schedules is app/worker side.
  -- Here we approximate by number of schedule rows with times for that user.
  select m.user_id, current_date as day, count(*) as expected_count
  from public.medicine_schedules s
  join public.medicines m on m.id = s.medicine_id
  group by 1,2
)
select
  coalesce(t.user_id, e.user_id) as user_id,
  coalesce(t.day, e.day) as day,
  coalesce(t.taken_count, 0) as taken_count,
  coalesce(e.expected_count, 0) as expected_count,
  case when coalesce(e.expected_count, 0) = 0 then null
       else round(100.0 * coalesce(t.taken_count, 0) / e.expected_count, 1) end as adherence_pct
from taken t
full join expected e
  on t.user_id = e.user_id and t.day = e.day;

-- View: weekly summary combined
create or replace view public.v_weekly_summary as
with water_week as (
  select user_id, date_trunc('week', day) as week, sum(total_ml) as water_total_ml
  from public.v_water_daily
  group by 1,2
),
med_week as (
  select user_id, date_trunc('week', day) as week,
    sum(taken_count) as taken_total,
    sum(expected_count) as expected_total
  from public.v_medicine_adherence_daily
  group by 1,2
)
select
  coalesce(w.user_id, m.user_id) as user_id,
  coalesce(w.week, m.week) as week,
  coalesce(w.water_total_ml, 0) as water_total_ml,
  coalesce(m.taken_total, 0) as meds_taken,
  coalesce(m.expected_total, 0) as meds_expected,
  case when coalesce(m.expected_total,0)=0 then null
       else round(100.0 * m.taken_total::numeric / m.expected_total, 1) end as adherence_pct
from water_week w
full join med_week m using (user_id, week);

-- RLS for views is inherited; create security barrier to prevent leaks
alter view public.v_water_daily set (security_barrier = true);
alter view public.v_medicine_adherence_daily set (security_barrier = true);
alter view public.v_weekly_summary set (security_barrier = true);