-- Make audit records server-generated and prevent clients from forging them.
-- The trigger records the actor and operation only; it deliberately excludes row contents/PII.

drop policy if exists "staff insert audit logs" on public.audit_logs;
revoke insert on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_row jsonb;
begin
  if tg_op = 'DELETE' then
    changed_row := to_jsonb(old);
  else
    changed_row := to_jsonb(new);
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    changed_row ->> 'id',
    jsonb_build_object('source', 'database_trigger')
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Trigger execution does not require clients to be able to call this function directly.
revoke all on function public.audit_row_change() from public, anon, authenticated;

create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.audit_row_change();

create trigger audit_locations
after insert or update or delete on public.locations
for each row execute function public.audit_row_change();

create trigger audit_menu_categories
after insert or update or delete on public.menu_categories
for each row execute function public.audit_row_change();

create trigger audit_menu_items
after insert or update or delete on public.menu_items
for each row execute function public.audit_row_change();

create trigger audit_products
after insert or update or delete on public.products
for each row execute function public.audit_row_change();

create trigger audit_reservations
after insert or update or delete on public.reservations
for each row execute function public.audit_row_change();

create trigger audit_orders
after insert or update or delete on public.orders
for each row execute function public.audit_row_change();

create trigger audit_order_items
after insert or update or delete on public.order_items
for each row execute function public.audit_row_change();

create trigger audit_catering_enquiries
after insert or update or delete on public.catering_enquiries
for each row execute function public.audit_row_change();

create trigger audit_site_content
after insert or update or delete on public.site_content
for each row execute function public.audit_row_change();
