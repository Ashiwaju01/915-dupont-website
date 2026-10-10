begin;
select plan(12);

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

select * from finish();
rollback;
