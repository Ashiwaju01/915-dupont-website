-- Secure guest reservations and configurable capacity rules.
-- Rules are disabled until Rooms explicitly configures each location.
create table public.reservation_settings (
  location_id uuid primary key references public.locations(id) on delete cascade,
  enabled boolean not null default false,
  timezone text,
  capacity integer check (capacity is null or capacity > 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 15 and 360),
  slot_interval_minutes integer check (slot_interval_minutes is null or slot_interval_minutes between 5 and 180),
  max_advance_days integer check (max_advance_days is null or max_advance_days between 1 and 365),
  min_advance_minutes integer check (min_advance_minutes is null or min_advance_minutes between 0 and 10080),
  max_party_size integer not null default 20 check (max_party_size between 1 and 20),
  -- Shape: {"monday":[{"open":"08:00","close":"17:00"}], ...}; overnight windows are not supported.
  opening_hours jsonb,
  updated_at timestamptz not null default now(),
  check (not enabled or (
    timezone is not null and capacity is not null and duration_minutes is not null
    and slot_interval_minutes is not null and max_advance_days is not null
    and min_advance_minutes is not null and opening_hours is not null
  ))
);
alter table public.reservation_settings enable row level security;
revoke all on public.reservation_settings from anon, authenticated;
grant select, insert, update, delete on public.reservation_settings to authenticated;
create policy "managers manage reservation settings"
on public.reservation_settings for all to authenticated
using (private.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (private.has_staff_role(array['owner','manager']::public.staff_role[]));

create table public.request_rate_limits (
  key_hash text primary key check (length(key_hash) = 64),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);
alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.request_rate_limits to service_role;

create or replace function public.consume_public_rate_limit(
  p_key_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_window_seconds < 1 or p_window_seconds > 86400
     or p_max_requests < 1 or p_max_requests > 1000 then
    return false;
  end if;

  insert into public.request_rate_limits(key_hash, window_started_at, request_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
    set window_started_at = case
          when now() >= public.request_rate_limits.window_started_at
                       + make_interval(secs => p_window_seconds)
          then now() else public.request_rate_limits.window_started_at end,
        request_count = case
          when now() >= public.request_rate_limits.window_started_at
                       + make_interval(secs => p_window_seconds)
          then 1 else public.request_rate_limits.request_count + 1 end,
        updated_at = now()
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;
revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;

create or replace function public.create_guest_reservation(
  p_location_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_party_size integer,
  p_starts_at timestamptz,
  p_customer_notes text default null
)
returns table(reservation_id uuid, confirmation_code text, starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.reservation_settings%rowtype;
  v_location_active boolean;
  v_local_start timestamp;
  v_local_end timestamp;
  v_day_key text;
  v_windows jsonb;
  v_window jsonb;
  v_open time;
  v_close time;
  v_end timestamptz;
  v_conflicts integer;
  v_reserved integer;
  v_id uuid;
  v_code text;
  v_now timestamptz := now();
begin
  if p_location_id is null or p_starts_at is null
     or p_guest_name is null or length(btrim(p_guest_name)) not between 2 and 120
     or p_guest_email is null or length(btrim(p_guest_email)) > 254
     or btrim(p_guest_email) !~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
     or (p_guest_phone is not null and length(btrim(p_guest_phone)) > 40)
     or p_party_size is null or p_party_size < 1 or p_party_size > 20
     or (p_customer_notes is not null and length(p_customer_notes) > 1000) then
    raise exception using errcode = '22023', message = 'Invalid reservation details';
  end if;

  select l.is_active into v_location_active
  from public.locations l where l.id = p_location_id;
  if coalesce(v_location_active, false) is false then
    raise exception using errcode = 'P0002', message = 'Location is unavailable';
  end if;

  -- Locking this settings row serializes bookings for a location so concurrent
  -- requests cannot overbook the same capacity window.
  select * into v_settings
  from public.reservation_settings s
  where s.location_id = p_location_id
  for update;
  if not found or not v_settings.enabled
     or v_settings.timezone is null or v_settings.capacity is null
     or v_settings.duration_minutes is null or v_settings.slot_interval_minutes is null
     or v_settings.max_advance_days is null or v_settings.min_advance_minutes is null
     or v_settings.opening_hours is null then
    raise exception using errcode = '55000', message = 'Reservations are not configured for this location';
  end if;

  if p_party_size > v_settings.max_party_size then
    raise exception using errcode = '22023', message = 'Party size exceeds this location''s limit';
  end if;

  v_local_start := p_starts_at at time zone v_settings.timezone;
  v_local_end := v_local_start + make_interval(mins => v_settings.duration_minutes);
  if p_starts_at < v_now + make_interval(mins => v_settings.min_advance_minutes)
     or p_starts_at > v_now + make_interval(days => v_settings.max_advance_days) then
    raise exception using errcode = '22023', message = 'Requested time is outside the booking window';
  end if;

  v_day_key := lower(to_char(v_local_start, 'FMDay'));
  v_windows := v_settings.opening_hours -> v_day_key;
  if jsonb_typeof(v_windows) <> 'array' then
    raise exception using errcode = '22023', message = 'Location is closed at the requested time';
  end if;

  for v_window in select value from jsonb_array_elements(v_windows)
  loop
    begin
      v_open := (v_window ->> 'open')::time;
      v_close := (v_window ->> 'close')::time;
    exception when others then
      raise exception using errcode = '22023', message = 'Location opening hours are misconfigured';
    end;
    if v_open >= v_close then
      raise exception using errcode = '22023', message = 'Overnight opening windows are not supported';
    end if;
    if v_local_start::time >= v_open
       and v_local_start::time < v_close
       and v_local_end::time <= v_close
       and v_local_end::date = v_local_start::date
       and mod(floor(extract(epoch from (v_local_start::time - v_open)) / 60)::integer,
               v_settings.slot_interval_minutes) = 0 then
      exit;
    end if;
    v_open := null;
  end loop;
  if v_open is null then
    raise exception using errcode = '22023', message = 'Requested time is outside available booking slots';
  end if;

  v_end := p_starts_at + make_interval(mins => v_settings.duration_minutes);
  select coalesce(sum(r.party_size), 0)::integer into v_reserved
  from public.reservations r
  where r.location_id = p_location_id
    and r.status in ('pending', 'confirmed')
    and r.starts_at < v_end
    and coalesce(r.ends_at, r.starts_at + make_interval(mins => v_settings.duration_minutes)) > p_starts_at;

  if v_reserved + p_party_size > v_settings.capacity then
    raise exception using errcode = 'P0001', message = 'No capacity remains for the requested time';
  end if;

  insert into public.reservations(
    location_id, guest_name, guest_email, guest_phone, party_size,
    starts_at, ends_at, status, customer_notes
  ) values (
    p_location_id, btrim(p_guest_name), lower(btrim(p_guest_email)),
    nullif(btrim(coalesce(p_guest_phone, '')), ''), p_party_size,
    p_starts_at, v_end, 'pending', nullif(btrim(coalesce(p_customer_notes, '')), '')
  )
  returning id, public.reservations.confirmation_code into v_id, v_code;

  return query select v_id, v_code, p_starts_at, v_end;
end;
$$;
revoke all on function public.create_guest_reservation(uuid, text, text, text, integer, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.create_guest_reservation(uuid, text, text, text, integer, timestamptz, text)
  to service_role;

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits(updated_at);
