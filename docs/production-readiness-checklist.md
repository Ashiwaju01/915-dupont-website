# Rooms / 915 Dupont production-readiness checklist

This checklist is deliberately strict. A merged pull request or a green CI run does not, by itself, mean the customer-facing site is production-ready.

## Repository work completed in this branch

- [x] Keep backend work separate from the existing customer-facing site.
- [x] Add the initial relational schema and enable RLS on application tables.
- [x] Add local Supabase configuration.
- [x] Add schema/RLS smoke tests and a GitHub Actions workflow for database lint and tests.
- [x] Restrict order and order-item writes to owner/manager roles in the initial migration.
- [x] Make order records read-only in the browser admin until trusted payment and fulfillment flows exist.
- [x] Normalize blank JSON, array, currency, and non-null numeric admin fields.
- [x] Keep Supabase project URL and publishable browser key separate from server secrets.
- [x] Add location-specific reservation settings with booking hours, timezone, capacity, duration, interval and advance-booking rules; disabled by default.
- [x] Add a server-only transactional reservation RPC with capacity locking and server-side rate-limit storage.
- [x] Add a guest reservation Edge Function with origin allowlisting, payload validation, honeypot handling, rate limits and safe responses.
- [x] Add a manager-only admin module to configure location reservation rules.

## Must pass before merging

- [x] GitHub Actions database lint completes successfully (run 38349469824).
- [x] GitHub Actions database tests complete successfully (run 38349469824).
- [x] Review migrations against a clean local Supabase database in CI.
- [ ] Review all RLS policies using anonymous, customer, staff, manager, and owner test identities.
- [ ] Confirm staff cannot write order totals, payment status, payment references, or order items.
- [ ] Confirm no service-role key or secret is present in repository history, client code, logs, or build artifacts.
- [ ] Verify admin layout, keyboard navigation, mobile navigation, form validation, errors, empty states, and sign-out in a browser.

## Must pass before production deployment

- [ ] Rooms creates and controls the production Supabase project, hosting account, email provider, payment provider, and any anti-spam service.
- [ ] Rooms approves the privacy notice, data retention policy, access list, cancellation policy, and customer support process.
- [ ] Reservation rules are documented: opening hours, booking windows, slot intervals, duration, capacity/table model, party-size rules, time zone, grace period, cancellation and rescheduling.
- [ ] Configure actual opening hours, IANA timezone, capacity, duration, slot interval, advance window, cancellation/rescheduling rules and confirmation workflow for every location.
- [ ] Apply and test the new reservation migration on a clean disposable database; deploy the reservation Edge Function only after setting `ALLOWED_ORIGINS` and server secrets. Verify concurrent booking attempts cannot exceed capacity and test daylight-saving transitions.
- [ ] Add CAPTCHA/managed anti-bot verification if abuse testing or business risk requires it; current controls are origin allowlisting, hashed-IP/email rate limits and a honeypot.
- [ ] Select Rooms' payment provider and checkout model before implementing a server-side order endpoint that calculates totals from trusted product records and reserves inventory atomically. Do not enable checkout until cancellation/expiry and inventory-release rules are implemented.
- [ ] Payment integration verifies signed webhooks, is idempotent, reconciles refunds, and handles failed/abandoned payments.
- [ ] Select an email/SMS provider and sender domain; configure transactional templates, sender-domain authentication, delivery failures and retry rules.
- [ ] Storage buckets have explicit public/private access rules, upload limits, allowed file types, and image ownership approvals.
- [ ] Staff invitations, account recovery, MFA policy, role revocation, and audit logging are tested.
- [ ] Backups, restore test, monitoring, alerting, incident contact, and rollback procedure are documented.
- [ ] Run an end-to-end acceptance test using test payment credentials and test email addresses; obtain Rooms' written sign-off.
- [ ] Deploy the backend and admin to a suitable host. Do not assume GitHub Pages can securely run server-side functions.
- [ ] Confirm the existing live site remains unchanged until the new implementation is explicitly accepted.

## Local verification

With Docker installed:

```sh
supabase start
supabase db lint --local
supabase test db
supabase stop --no-backup
```

The GitHub Actions workflow runs the lint and database tests on matching pull requests and pushes. If the workflow has not produced a run, treat test status as **not verified**, not passed.

## Important limitation

The schema and reservation endpoint are still pre-release. The database migrations (including reservation settings, rate limiting, and the transactional guest-reservation RPC) have been applied to the connected development Supabase project and its migration history reconciled. The Edge Function is committed to the feature branch but has not been deployed. No locations or reservation rules have been configured, so the reservation RPC fails closed. RLS smoke tests do not replace a full authorization matrix, transactional concurrency tests, provider webhook tests, or live end-to-end acceptance. The current public reservation function intentionally has JWT verification disabled because guests are not signed in; it must be deployed only with `ALLOWED_ORIGINS` set and the required server secrets configured. CI run 38349469824 passed admin JavaScript syntax, Deno type-checking, migration-version uniqueness, local Supabase startup, migration lint and database tests. The reservation timestamp timezone-offset validator was corrected afterward and needs a fresh CI pass.
