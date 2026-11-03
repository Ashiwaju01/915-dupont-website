-- Apply the owner-confirmed Rooms booking configuration with a new version.
-- The earlier hours/defaults migration version is already present in production history,
-- so its reconstructed repository file is not replayed by a normal migration push.
do $$
declare
  v_locations integer;
  v_settings integer;
begin
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
  get diagnostics v_locations = row_count;

  update public.reservation_settings s
  set enabled = false,
      timezone = 'America/Toronto',
      capacity = 6,
      duration_minutes = 90,
      slot_interval_minutes = 60,
      max_advance_days = 30,
      min_advance_minutes = 1440,
      max_party_size = 6,
      opening_hours = l.opening_hours
  from public.locations l
  where s.location_id = l.id
    and l.slug in ('ossington', 'baldwin', 'dupont');
  get diagnostics v_settings = row_count;

  if v_locations <> 3 or v_settings <> 3 then
    raise exception 'Expected to configure three Rooms locations and settings rows (locations %, settings %)',
      v_locations, v_settings;
  end if;
end;
$$;
