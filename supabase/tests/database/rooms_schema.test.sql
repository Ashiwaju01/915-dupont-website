begin;
select plan(69);

-- Authorization-matrix fixtures are isolated by this file's outer transaction and rollback.
-- Auth triggers create customer profiles; trusted test setup promotes selected fixtures.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111101', 'authenticated', 'authenticated', 'rooms-customer@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11111111-1111-4111-8111-111111111102', 'authenticated', 'authenticated', 'rooms-other-customer@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11111111-1111-4111-8111-111111111103', 'authenticated', 'authenticated', 'rooms-staff@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11111111-1111-4111-8111-111111111104', 'authenticated', 'authenticated', 'rooms-manager@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('11111111-1111-4111-8111-111111111105', 'authenticated', 'authenticated', 'rooms-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set role = 'staff'
where id = '11111111-1111-4111-8111-111111111103';
update public.profiles set role = 'manager'
where id = '11111111-1111-4111-8111-111111111104';
update public.profiles set role = 'owner'
where id = '11111111-1111-4111-8111-111111111105';

insert into public.orders (
  id, customer_id, customer_email, customer_name, subtotal_cents, total_cents
) values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 'rooms-customer@example.test', 'Test Customer', 1200, 1200),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 'rooms-other-customer@example.test', 'Other Customer', 2400, 2400);

insert into public.order_items (
  id, order_id, product_name, quantity, unit_price_cents, line_total_cents
) values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Test item', 1, 1200, 1200),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'Other item', 1, 2400, 2400);


select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'locations', 'locations table exists');
select is(
  (select count(*)::integer from public.locations),
  3,
  'the three Rooms locations are seeded for admin setup'
);
select ok(
  not exists (select 1 from public.reservation_settings where enabled),
  'seeded locations do not enable bookings without approved rules'
);
select has_table('public', 'menu_categories', 'menu categories table exists');
select has_table('public', 'menu_items', 'menu items table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'reservations', 'reservations table exists');
select has_table('public', 'orders', 'orders table exists');
select has_table('public', 'order_items', 'order items table exists');
select has_table('public', 'catering_enquiries', 'catering enquiries table exists');
select has_table('public', 'site_content', 'site content table exists');
select has_table('public', 'audit_logs', 'audit logs table exists');
select has_table('public', 'reservation_internal_notes', 'staff-only reservation notes table exists');

select ok(
  (select count(*) = 12 from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and c.relname = any(array[
       'profiles','locations','menu_categories','menu_items','products',
       'reservations','orders','order_items','catering_enquiries','site_content',
       'audit_logs','reservation_internal_notes'
     ])
     and c.relrowsecurity),
  'RLS is enabled on every application table'
);

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reservations'
      and column_name = 'internal_notes'
  ),
  'staff-only notes are not exposed on customer-readable reservations rows'
);
select ok(
  not has_table_privilege('anon', 'public.reservations', 'INSERT'),
  'anonymous visitors cannot insert reservations directly'
);
select ok(
  not has_table_privilege('anon', 'public.orders', 'INSERT'),
  'anonymous visitors cannot insert orders directly'
);
select ok(
  has_table_privilege('anon', 'public.catering_enquiries', 'INSERT'),
  'anonymous visitors can submit catering enquiries through the guarded table policy'
);
select ok(
  not has_table_privilege('anon', 'public.audit_logs', 'SELECT'),
  'anonymous visitors cannot read audit logs'
);
select ok(
  has_table_privilege('anon', 'public.products', 'SELECT'),
  'anonymous visitors can read products subject to active-row RLS'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'managers manage orders'
      and cmd = 'ALL'
  ),
  'only owner/manager policy can mutate orders'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'order_items'
      and policyname = 'managers manage order items'
      and cmd = 'ALL'
  ),
  'only owner/manager policy can mutate order items'
);
select ok(
  (select count(*) = 9
   from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and not t.tgisinternal
     and t.tgname like 'set_updated_at_%'),
  'updated_at triggers exist on all mutable timestamped tables'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'signed-in clients cannot forge audit log rows'
);
select ok(
  (select count(*) = 11
   from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and not t.tgisinternal
     and t.tgname like 'audit_%'),
  'database audit triggers cover all eleven mutable business tables, including reservation settings'
);
select ok(
  not has_function_privilege('anon', 'public.audit_row_change()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.audit_row_change()', 'EXECUTE'),
  'clients cannot call the audit trigger function directly'
);
select ok(
  not has_function_privilege('anon', 'public.handle_new_auth_user()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.handle_new_auth_user()', 'EXECUTE'),
  'clients cannot call the auth trigger function directly'
);

select ok(
  to_regprocedure('public.has_staff_role(public.staff_role[])') is null,
  'staff-role helper is not exposed through the public API schema'
);
select ok(
  to_regprocedure('private.has_staff_role(public.staff_role[])') is not null,
  'staff-role helper exists in the private schema'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and (
        (coalesce(qual, '') like '%has_staff_role%' and coalesce(qual, '') not like '%private.has_staff_role%')
        or
        (coalesce(with_check, '') like '%has_staff_role%' and coalesce(with_check, '') not like '%private.has_staff_role%')
      )
  ),
  'all staff authorization policies call the private helper'
);

select has_table('public', 'reservation_settings', 'reservation settings table exists');
select has_table('public', 'request_rate_limits', 'hashed rate-limit table exists');
select ok(
  (select count(*) = 2 from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname = any(array['reservation_settings','request_rate_limits'])
     and c.relrowsecurity),
  'RLS is enabled on both reservation-support tables'
);
select ok(
  not has_table_privilege('anon', 'public.reservation_settings', 'SELECT'),
  'anonymous visitors cannot read reservation settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.request_rate_limits', 'SELECT'),
  'signed-in browser clients cannot inspect rate-limit keys'
);
select ok(
  not has_function_privilege('anon', 'public.create_guest_reservation(uuid,text,text,text,integer,timestamptz,text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.create_guest_reservation(uuid,text,text,text,integer,timestamptz,text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.create_guest_reservation(uuid,text,text,text,integer,timestamptz,text)', 'EXECUTE'),
  'only the trusted server role can create guest reservations'
);
select ok(
  not has_function_privilege('anon', 'public.consume_public_rate_limit(text,integer,integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.consume_public_rate_limit(text,integer,integer)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.consume_public_rate_limit(text,integer,integer)', 'EXECUTE'),
  'only the trusted server role can consume public rate limits'
);
select ok(
  (select column_default like 'false%' from information_schema.columns
   where table_schema = 'public' and table_name = 'reservation_settings' and column_name = 'enabled'),
  'new location reservation settings are disabled until configured'
);


select is(
  (select count(*)::integer from public.reservation_settings
   where location_id in (select id from public.locations where slug in ('ossington','baldwin','dupont'))),
  3,
  'each Rooms location has reservation settings'
);
select ok(
  (select count(*) = 3 and bool_and(slot_interval_minutes = 60)
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'all locations use the confirmed 60-minute slot interval'
);
select ok(
  (select count(*) = 3 and bool_and(max_advance_days = 30)
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'all locations use the confirmed 30-day advance booking window'
);
select ok(
  (select count(*) = 3 and bool_and(min_advance_minutes = 1440)
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'all locations require the confirmed 24-hour minimum notice'
);
select ok(
  (select count(*) = 3 and bool_and(capacity = 6 and not enabled)
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'all locations remain disabled with the confirmed capacity of six'
);
select ok(
  (select count(*) = 3 and bool_and(
    opening_hours -> 'monday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'tuesday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'wednesday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'thursday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'friday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'saturday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
    and opening_hours -> 'sunday' = '[{"open":"08:00","close":"18:30"}]'::jsonb
  ) from public.locations where slug in ('ossington','baldwin','dupont')),
  'all locations use the confirmed 08:00–18:30 daily opening hours'
);
select ok(
  (select count(*) = 3 and bool_and(s.opening_hours = l.opening_hours)
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'reservation settings opening hours match the location opening hours'
);

select ok(
  (select count(*) = 3 and bool_and(timezone = 'America/Toronto')
   from public.reservation_settings s join public.locations l on l.id = s.location_id
   where l.slug in ('ossington','baldwin','dupont')),
  'all locations use the Toronto time zone'
);

-- Exercise the reservation RPC against temporary local-test settings. The outer
-- transaction rolls back these settings and the test reservations at the end.
update public.reservation_settings s
set enabled = true,
    capacity = 6,
    duration_minutes = 90,
    slot_interval_minutes = 60,
    max_advance_days = 30,
    min_advance_minutes = 1440,
    timezone = 'America/Toronto',
    opening_hours = (select l.opening_hours from public.locations l where l.id = s.location_id)
where s.location_id = (select id from public.locations where slug = 'ossington');

select lives_ok(
  $select * from public.create_guest_reservation(
    (select id from public.locations where slug = 'ossington'),
    'Capacity Test Four', 'capacity-four@example.test', null, 4,
    ((date_trunc('day', now() at time zone 'America/Toronto') + interval '2 days' + interval '10 hours') at time zone 'America/Toronto'),
    null
  )$,
  'first four-person reservation fits within six-person capacity'
);
select throws_ok(
  $select * from public.create_guest_reservation(
    (select id from public.locations where slug = 'ossington'),
    'Capacity Test Three', 'capacity-three@example.test', null, 3,
    ((date_trunc('day', now() at time zone 'America/Toronto') + interval '2 days' + interval '10 hours') at time zone 'America/Toronto'),
    null
  )$,
  'P0001',
  'No capacity remains for the requested time',
  'overlapping reservations cannot exceed six guests'
);
select lives_ok(
  $select * from public.create_guest_reservation(
    (select id from public.locations where slug = 'ossington'),
    'Capacity Test Two', 'capacity-two@example.test', null, 2,
    ((date_trunc('day', now() at time zone 'America/Toronto') + interval '2 days' + interval '10 hours') at time zone 'America/Toronto'),
    null
  )$,
  'second overlapping reservation is accepted when total reaches six'
);
select throws_ok(
  $select * from public.create_guest_reservation(
    (select id from public.locations where slug = 'ossington'),
    'Capacity Test One', 'capacity-one@example.test', null, 1,
    ((date_trunc('day', now() at time zone 'America/Toronto') + interval '2 days' + interval '10 hours') at time zone 'America/Toronto'),
    null
  )$,
  'P0001',
  'No capacity remains for the requested time',
  'capacity rejects even one additional guest after six seats are reserved'
);
select is(
  (select coalesce(sum(party_size), 0)::integer
   from public.reservations r
   where r.location_id = (select id from public.locations where slug = 'ossington')
     and r.guest_email in ('capacity-four@example.test', 'capacity-two@example.test')
     and r.status = 'pending'),
  6,
  'successful overlapping test reservations total exactly six guests'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reservations'
      and policyname = 'customer create reservation'
  ),
  'customer direct reservation insert policy is disabled until endpoint validation exists'
);

select ok(
  (select count(*) = 1 from pg_policies
   where schemaname = 'public' and tablename = 'orders'
     and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')),
  'orders have exactly one mutating policy, reserved for owner/manager'
);
select ok(
  (select count(*) = 1 from pg_policies
   where schemaname = 'public' and tablename = 'order_items'
     and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')),
  'order items have exactly one mutating policy, reserved for owner/manager'
);
select ok(
  (select coalesce(qual, '') like '%owner%'
          and coalesce(qual, '') like '%manager%'
          and coalesce(qual, '') not like '%''staff''::staff_role%'
   from pg_policies
   where schemaname = 'public' and tablename = 'orders'
     and policyname = 'managers manage orders' and cmd = 'ALL'),
  'order mutation policy excludes staff and customers'
);
select ok(
  (select coalesce(qual, '') like '%owner%'
          and coalesce(qual, '') like '%manager%'
          and coalesce(qual, '') not like '%''staff''::staff_role%'
   from pg_policies
   where schemaname = 'public' and tablename = 'order_items'
     and policyname = 'managers manage order items' and cmd = 'ALL'),
  'order-item mutation policy excludes staff and customers'
);
select ok(
  not has_table_privilege('authenticated', 'public.orders', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.order_items', 'TRUNCATE'),
  'browser-authenticated users cannot truncate financial tables'
);
select ok(
  (select coalesce(qual, '') like '%owner%'
          and coalesce(qual, '') like '%manager%'
          and coalesce(qual, '') not like '%''staff''::staff_role%'
   from pg_policies
   where schemaname = 'public' and tablename = 'reservation_settings'
     and policyname = 'managers manage reservation settings' and cmd = 'ALL'),
  'only owners and managers can change reservation settings'
);
select ok(
  (select coalesce(qual, '') like '%owner%'
          and coalesce(qual, '') like '%manager%'
          and coalesce(qual, '') not like '%''staff''::staff_role%'
   from pg_policies
   where schemaname = 'public' and tablename = 'audit_logs'
     and policyname = 'owner and managers read audit logs' and cmd = 'SELECT'),
  'staff and customers cannot read the audit log'
);
select ok(
  (select coalesce(with_check, '') like '%customer%'
   from pg_policies
   where schemaname = 'public' and tablename = 'profiles'
     and policyname = 'profile update self basic' and cmd = 'UPDATE'),
  'self-service profile updates cannot promote a customer to staff'
);
select ok(
  (select count(*) = 2
          and bool_and(coalesce(qual, '') like '%owner%'
                       and coalesce(qual, '') like '%manager%'
                       and coalesce(qual, '') like '%staff%')
   from pg_policies
   where schemaname = 'public' and tablename = 'reservation_internal_notes'
     and cmd in ('SELECT', 'ALL')),
  'reservation internal notes are restricted to staff roles'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111101', true);
select is((select count(*)::integer from public.orders), 1, 'customer can read only their own order');
select is((select count(*)::integer from public.order_items), 1, 'customer can read only items belonging to their own order');
update public.orders set total_cents = 99999
where id = '22222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '22222222-2222-4222-8222-222222222201'), 1200, 'customer cannot alter even their own order total');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111103', true);
select is((select count(*)::integer from public.orders), 2, 'staff can read all orders for service');
update public.orders set total_cents = 99999
where id = '22222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '22222222-2222-4222-8222-222222222201'), 1200, 'staff cannot alter order totals');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111104', true);
update public.orders set total_cents = 1300
where id = '22222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '22222222-2222-4222-8222-222222222201'), 1300, 'manager can perform authorized order management');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111105', true);
update public.orders set total_cents = 1400
where id = '22222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '22222222-2222-4222-8222-222222222201'), 1400, 'owner can perform authorized order management');
reset role;

select * from finish();
rollback;
