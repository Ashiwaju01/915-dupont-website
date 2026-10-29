-- Record the booking-window rules confirmed by the project owner.
-- Capacity and booking-window rules are confirmed; keep every location disabled until release checks pass.
do $$
declare
  v_updated integer;
begin
  update public.reservation_settings s
  set enabled = false,
      slot_interval_minutes = 60,
      max_advance_days = 30,
      min_advance_minutes = 1440
  from public.locations l
  where s.location_id = l.id
    and l.slug in ('ossington', 'baldwin', 'dupont');

  get diagnostics v_updated = row_count;
  if v_updated <> 3 then
    raise exception 'Expected to configure exactly three Rooms locations, updated %', v_updated;
  end if;
end;
$$;
