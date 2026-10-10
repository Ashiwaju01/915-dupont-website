begin;
select plan(17);

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

select ok(
  (select count(*) = 11 from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and c.relname = any(array[
       'profiles','locations','menu_categories','menu_items','products',
       'reservations','orders','order_items','catering_enquiries','site_content','audit_logs'
     ])
     and c.relrowsecurity),
  'RLS is enabled on every application table'
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

select * from finish();
rollback;
