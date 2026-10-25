-- Reconstruct the previously applied Rooms location-hours and disabled-booking defaults.
-- Opening hours reflect the current database values; Rooms must confirm them before reservations are enabled.
update public.locations
set opening_hours = jsonb_build_object(
  'monday',    jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'tuesday',   jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'wednesday', jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'thursday',  jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'friday',    jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'saturday',  jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end)),
  'sunday',    jsonb_build_array(jsonb_build_object('open', case when slug = 'dupont' then '09:00' else '08:00' end, 'close', case when slug = 'dupont' then '15:30' else '18:30' end))
)
where slug in ('ossington', 'baldwin', 'dupont');

insert into public.reservation_settings (
  location_id, enabled, timezone, capacity, duration_minutes,
  slot_interval_minutes, max_advance_days, min_advance_minutes,
  max_party_size, opening_hours
)
select
  l.id, false, 'America/Toronto', null, 90,
  null, null, null, 6, l.opening_hours
from public.locations l
where l.slug in ('ossington', 'baldwin', 'dupont')
on conflict (location_id) do update
set enabled = false,
    timezone = excluded.timezone,
    capacity = null,
    duration_minutes = excluded.duration_minutes,
    slot_interval_minutes = null,
    max_advance_days = null,
    min_advance_minutes = null,
    max_party_size = excluded.max_party_size,
    opening_hours = excluded.opening_hours;
