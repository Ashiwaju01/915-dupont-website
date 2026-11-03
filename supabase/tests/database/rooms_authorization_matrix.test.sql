begin;
select plan(18);

-- Isolated identities and records. This suite runs on the disposable local DB in CI.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('51111111-1111-4111-8111-111111111101', 'authenticated', 'authenticated', 'matrix-customer-a@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('51111111-1111-4111-8111-111111111102', 'authenticated', 'authenticated', 'matrix-customer-b@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('51111111-1111-4111-8111-111111111103', 'authenticated', 'authenticated', 'matrix-staff@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('51111111-1111-4111-8111-111111111104', 'authenticated', 'authenticated', 'matrix-manager@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('51111111-1111-4111-8111-111111111105', 'authenticated', 'authenticated', 'matrix-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles set role = 'staff' where id = '51111111-1111-4111-8111-111111111103';
update public.profiles set role = 'manager' where id = '51111111-1111-4111-8111-111111111104';
update public.profiles set role = 'owner' where id = '51111111-1111-4111-8111-111111111105';

insert into public.orders (
  id, customer_id, customer_email, customer_name, subtotal_cents, total_cents
) values
  ('52222222-2222-4222-8222-222222222201', '51111111-1111-4111-8111-111111111101', 'matrix-customer-a@example.test', 'Matrix A', 1000, 1000),
  ('52222222-2222-4222-8222-222222222202', '51111111-1111-4111-8111-111111111102', 'matrix-customer-b@example.test', 'Matrix B', 2000, 2000);
insert into public.order_items (
  id, order_id, product_name, quantity, unit_price_cents, line_total_cents
) values
  ('53333333-3333-4333-8333-333333333301', '52222222-2222-4222-8222-222222222201', 'Matrix item A', 1, 1000, 1000),
  ('53333333-3333-4333-8333-333333333302', '52222222-2222-4222-8222-222222222202', 'Matrix item B', 1, 2000, 2000);
insert into public.reservations (
  id, location_id, customer_id, guest_name, guest_email, party_size, starts_at, ends_at, status
) values
  ('54444444-4444-4444-8444-444444444401', (select id from public.locations order by slug limit 1), '51111111-1111-4111-8111-111111111101', 'Matrix A', 'matrix-customer-a@example.test', 2, now() + interval '40 days', now() + interval '40 days 90 minutes', 'pending'),
  ('54444444-4444-4444-8444-444444444402', (select id from public.locations order by slug limit 1), '51111111-1111-4111-8111-111111111102', 'Matrix B', 'matrix-customer-b@example.test', 2, now() + interval '41 days', now() + interval '41 days 90 minutes', 'pending');
insert into public.reservation_internal_notes (reservation_id, notes)
values
  ('54444444-4444-4444-8444-444444444401', 'private note A'),
  ('54444444-4444-4444-8444-444444444402', 'private note B');

-- Anonymous users must not see customer reservations, staff notes or reservation settings.
set local role anon;
select is((select count(*)::integer from public.reservations), 0, 'anonymous role cannot read reservations');
select is((select count(*)::integer from public.reservation_internal_notes), 0, 'anonymous role cannot read staff-only notes');
select is((select count(*)::integer from public.reservation_settings), 0, 'anonymous role cannot read reservation settings');
reset role;

-- Customer A can see only their own reservation/order and cannot see internal notes.
set local role authenticated;
select set_config('request.jwt.claim.sub', '51111111-1111-4111-8111-111111111101', true);
select is((select count(*)::integer from public.reservations), 1, 'customer sees only their own reservation');
select is((select count(*)::integer from public.orders), 1, 'customer sees only their own order');
select is((select count(*)::integer from public.order_items), 1, 'customer sees only their own order items');
select is((select count(*)::integer from public.reservation_internal_notes), 0, 'customer cannot read internal reservation notes');
select is((select count(*)::integer from public.reservation_settings), 0, 'customer cannot read reservation settings');
update public.orders set total_cents = 77777 where id = '52222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '52222222-2222-4222-8222-222222222201'), 1000, 'customer cannot change their order total');
update public.order_items set unit_price_cents = 77777 where id = '53333333-3333-4333-8333-333333333301';
select is((select unit_price_cents from public.order_items where id = '53333333-3333-4333-8333-333333333301'), 1000, 'customer cannot change their order item price');

-- Staff can service reservations and read notes, but cannot mutate financial/order lines.
select set_config('request.jwt.claim.sub', '51111111-1111-4111-8111-111111111103', true);
select is((select count(*)::integer from public.reservations), 2, 'staff can read all reservations');
select is((select count(*)::integer from public.reservation_internal_notes), 2, 'staff can read internal notes');
update public.orders set total_cents = 88888 where id = '52222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '52222222-2222-4222-8222-222222222201'), 1000, 'staff cannot change order totals');

-- Deactivating a staff identity must immediately remove staff RLS access.
update public.profiles set active = false where id = '51111111-1111-4111-8111-111111111103';
select is((select count(*)::integer from public.reservations), 0, 'deactivated staff loses reservation access');
select is((select count(*)::integer from public.reservation_internal_notes), 0, 'deactivated staff loses internal-note access');
reset role;

-- Managers and owners retain explicitly granted financial administration rights.
set local role authenticated;
select set_config('request.jwt.claim.sub', '51111111-1111-4111-8111-111111111104', true);
update public.orders set total_cents = 1100 where id = '52222222-2222-4222-8222-222222222201';
select is((select total_cents from public.orders where id = '52222222-2222-4222-8222-222222222201'), 1100, 'manager can update order total');
select set_config('request.jwt.claim.sub', '51111111-1111-4111-8111-111111111105', true);
update public.order_items set unit_price_cents = 1100 where id = '53333333-3333-4333-8333-333333333301';
select is((select unit_price_cents from public.order_items where id = '53333333-3333-4333-8333-333333333301'), 1100, 'owner can update order item price');
reset role;

select * from finish();
rollback;
