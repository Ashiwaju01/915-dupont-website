-- Keep reservation staff-only notes out of the customer-readable reservations row.
-- Existing notes are migrated before the original column is removed.
create table public.reservation_internal_notes (
  reservation_id uuid primary key references public.reservations(id) on delete cascade,
  notes text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.reservation_internal_notes (reservation_id, notes, updated_at)
select id, internal_notes, updated_at
from public.reservations
where internal_notes is not null and btrim(internal_notes) <> ''
on conflict (reservation_id) do nothing;

alter table public.reservation_internal_notes enable row level security;

create policy "staff read reservation internal notes"
on public.reservation_internal_notes for select to authenticated
using (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

create policy "staff manage reservation internal notes"
on public.reservation_internal_notes for all to authenticated
using (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

revoke all on public.reservation_internal_notes from anon, authenticated;
grant select, insert, update, delete on public.reservation_internal_notes to authenticated;

alter table public.reservations drop column internal_notes;

-- Trigger-only functions must not be directly executable by API roles.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- RLS calls this helper for both public/anonymous reads and authenticated staff checks.
revoke all on function public.has_staff_role(public.staff_role[]) from public;
grant execute on function public.has_staff_role(public.staff_role[]) to anon, authenticated;
