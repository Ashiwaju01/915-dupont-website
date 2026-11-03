-- Keep reservation rule edits timestamped and auditable.
create trigger set_updated_at_reservation_settings
before update on public.reservation_settings
for each row execute function public.set_updated_at();

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
    coalesce(changed_row ->> 'id', changed_row ->> 'location_id'),
    jsonb_build_object('source', 'database_trigger')
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function public.audit_row_change() from public, anon, authenticated;

create trigger audit_reservation_settings
after insert or update or delete on public.reservation_settings
for each row execute function public.audit_row_change();
