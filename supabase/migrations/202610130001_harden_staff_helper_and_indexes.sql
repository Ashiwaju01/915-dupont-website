-- Move the staff-role SECURITY DEFINER helper out of the exposed API schema.
-- RLS policies may call the private helper, but PostgREST only exposes public/graphql_public.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.has_staff_role(allowed_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.active = true
      and p.role = any(allowed_roles)
  );
$$;

revoke all on function private.has_staff_role(public.staff_role[]) from public;
grant execute on function private.has_staff_role(public.staff_role[]) to anon, authenticated;

-- Repoint all existing RLS policies before removing the public helper.
do $$
declare
  pol record;
  using_expr text;
  check_expr text;
  stmt text;
begin
  for pol in
    select p.polname, n.nspname as schemaname, c.relname as tablename,
           p.polrelid, p.polqual, p.polwithcheck
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%has_staff_role(%'
        or coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') like '%has_staff_role(%'
      )
  loop
    using_expr := replace(pg_get_expr(pol.polqual, pol.polrelid), 'has_staff_role(', 'private.has_staff_role(');
    check_expr := replace(pg_get_expr(pol.polwithcheck, pol.polrelid), 'has_staff_role(', 'private.has_staff_role(');
    stmt := format('alter policy %I on %I.%I', pol.polname, pol.schemaname, pol.tablename);
    if using_expr is not null then stmt := stmt || format(' using (%s)', using_expr); end if;
    if check_expr is not null then stmt := stmt || format(' with check (%s)', check_expr); end if;
    execute stmt;
  end loop;
end $$;

revoke all on function public.has_staff_role(public.staff_role[]) from public, anon, authenticated;
drop function public.has_staff_role(public.staff_role[]);

-- Cover foreign-key lookups to avoid avoidable scans as the data grows.
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists menu_items_category_id_idx on public.menu_items(category_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists site_content_updated_by_idx on public.site_content(updated_by);
create index if not exists reservation_internal_notes_updated_by_idx on public.reservation_internal_notes(updated_by);
