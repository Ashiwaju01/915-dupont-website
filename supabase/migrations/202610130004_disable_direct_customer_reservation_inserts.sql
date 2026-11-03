-- Until the transactional reservation-request endpoint exists, prevent customer-role sessions from inserting reservations directly.
-- Staff retain access through the staff-management policy for manual back-office entry.
drop policy if exists "customer create reservation" on public.reservations;
