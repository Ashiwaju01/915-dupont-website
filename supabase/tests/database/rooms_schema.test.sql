begin;
select plan(29);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'locations', 'locations table exists');
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
  (select count(*) = 8
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
  (select count(*) = 10
   from pg_trigger t
   join pg_class c on c.oid = t.tgrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and not t.tgisinternal
     and t.tgname like 'audit_%'),
  'database audit triggers cover all ten mutable business tables'
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

select * from finish();
rollback;
