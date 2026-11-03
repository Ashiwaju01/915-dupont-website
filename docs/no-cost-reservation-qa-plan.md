# Rooms reservation QA — no-cost execution plan

This branch is an isolated code/CI workspace. Do not point these tests at either live Supabase project. Do not enable reservations, change production settings, deploy functions, or merge this branch as part of QA.

## What this branch adds

- `supabase/tests/database/rooms_toronto_dst.test.sql` adds six pgTAP assertions for Toronto's 2026 fall-back and 2027 spring-forward timezone conversions. It also records PostgreSQL's handling of the repeated 01:30 wall-clock time.
- The existing schema suite continues to cover sequential capacity limits and selected RLS/role behavior. Those checks are not concurrency proof and do not yet constitute a complete five-role authorization matrix.

## No-cost test environment

Use a local Supabase stack on a machine with Docker and the Supabase CLI already installed:

```sh
supabase start
supabase db lint --local
supabase test db
supabase stop --no-backup
```

These commands run against the local disposable database, not the connected hosted project. If Docker is unavailable, do not substitute a live project; record the test as blocked.

## Required concurrency acceptance

The reservation RPC locks the location's `reservation_settings` row with `FOR UPDATE`. The implementation is designed to serialize booking attempts per location, but that design must be exercised with independent database sessions before it is accepted.

On a disposable local database only:

1. Seed/identify one test location and set its reservation settings to enabled with capacity 6, duration 90 minutes, a 60-minute interval, a 30-day advance window, and a valid test opening window.
2. Choose one valid Toronto-local slot at least 24 hours ahead and within 30 days.
3. Start at least 12 independent clients simultaneously; each calls `public.create_guest_reservation` for that same location/slot with party size 1 and a unique test email.
4. Treat the expected capacity exception (`P0001`, `No capacity remains for the requested time`) as a rejected booking, not a test infrastructure failure.
5. Assert that exactly six bookings commit and the sum of committed overlapping party sizes is never greater than six.
6. Repeat with mixed party sizes and with pre-existing pending/confirmed bookings. Verify cancelled bookings do not consume capacity.
7. Save the exact command, client count, successful/rejected counts, and final SQL verification output in the QA evidence.

Do not call this test passed until it has actually run with independent connections. A sequential pgTAP test or a source-code review is insufficient.

## Remaining acceptance gates

- **Timezone/DST:** the new pgTAP file checks PostgreSQL's IANA timezone conversions. Still verify the actual reservation RPC with offset-aware timestamps around both DST transitions, opening/closing boundaries, slot alignment, 24-hour minimum notice, and 30-day maximum. Ambiguous local wall times must be submitted with an explicit UTC offset; never silently infer which repeated hour a customer intended.
- **Authorization:** exercise anonymous, customer, staff, manager and owner identities against reservation rows, reservation settings, internal notes, orders and order items. Include forbidden writes, cross-customer reads, staff restrictions on totals/payment fields, and role revocation.
- **Browser acceptance:** requires a disposable staging deployment. Check location/date/time/party-size flow, disabled/full-capacity states, confirmation display, network errors, rate limits, mobile layout and keyboard accessibility. This cannot be truthfully marked complete from SQL tests alone.
- **Release controls:** verify origin allowlisting, secret handling, logs, backups and restore, monitoring, rollback, notification delivery, cancellation/rescheduling policy and written business sign-off.

## Current release rule

A green CI run is necessary but not sufficient. Keep the feature branch unmerged and customer bookings disabled until all applicable gates above have evidence and Rooms approves release. No production deployment is authorized by this QA plan.
