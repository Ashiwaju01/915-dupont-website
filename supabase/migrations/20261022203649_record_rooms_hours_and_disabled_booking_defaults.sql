-- Reconstruct the previously applied Rooms location-hours and disabled-booking defaults.
-- Opening hours reflect the current database values; Rooms must confirm them before reservations are enabled.
update public.locations
set opening_hours = jsonb_build_object(
  'monday',    jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'tuesday',   jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'wednesday', jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'thursday',  jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'friday',    jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'saturday',  jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30')),
  'sunday',    jsonb_build_array(jsonb_build_object('open', '08:00', 'close', '18:30'))
)
where slug in ('ossington', 'baldwin', 'dupont');

insert into public.reservation_settings (
  location_id, enabled, timezone, capacity, duration_minutes,
  slot_interval_minutes, max_advance_days, min_advance_minutes,
  max_party_size, opening_hours
)
select
  l.id, false, 'America/Toronto', 6, 90,
  null, null, null, 6, l.opening_hours
from public.locations l
where l.slug in ('ossington', 'baldwin', 'dupont')
on conflict (location_id) do update
set enabled = false,
    timezone = excluded.timezone,
    capacity = 6,
    duration_minutes = excluded.duration_minutes,
    slot_interval_minutes = null,
    max_advance_days = null,
    min_advance_minutes = null,
    max_party_size = excluded.max_party_size,
    opening_hours = excluded.opening_hours;
