-- Seed the three Rooms locations named by the current website concept.
-- Do not create reservation_settings here: booking rules require explicit business approval.
insert into public.locations (slug, name, address, description, opening_hours, is_active, sort_order)
values
  ('ossington', 'Rooms 135 Ossington', '135 Ossington Ave, Toronto, ON, Canada', 'Neighbourhood café.', '{}'::jsonb, true, 1),
  ('baldwin', 'Rooms 17 Baldwin', '17 Baldwin St, Toronto, ON, Canada', 'Hi-fi coffee room.', '{}'::jsonb, true, 2),
  ('dupont', 'Rooms 915 Dupont', '915 Dupont St, Toronto, ON, Canada', 'Coffee by day and listening room by night.', '{}'::jsonb, true, 3)
on conflict (slug) do update
set name = excluded.name,
    address = excluded.address,
    description = excluded.description,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;
