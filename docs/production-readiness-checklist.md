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

- [x] GitHub Actions database lint completes successfully (run 38898836317).
- [x] GitHub Actions database tests complete successfully (run 38898836317).
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

The schema and reservation endpoint are still pre-release. The database migrations (including reservation settings, rate limiting, and the transactional guest-reservation RPC) have been applied to the connected development Supabase project and its migration history reconciled. The `reservation-create` Edge Function is already ACTIVE in the connected Supabase project (version 1, `verify_jwt=false`), as confirmed by a read-only function inventory on 2026-10-29. This does not mean the customer-facing booking flow is live: all three reservation settings remain disabled. Production booking settings are not yet synchronized with the approved branch configuration. RLS smoke tests do not replace a full authorization matrix, transactional concurrency tests, provider webhook tests, or live end-to-end acceptance. The current public reservation function intentionally has JWT verification disabled because guests are not signed in; it must be deployed only with `ALLOWED_ORIGINS` set and the required server secrets configured. CI run 38898836317 passed admin JavaScript syntax, Deno type-checking, whitespace checks, migration-version uniqueness, local Supabase startup, migration lint and database tests after the reservation timestamp validator, seeded locations, and RLS test fixes. The connected database was also updated with the corrected reservation RPC and verified.

## Reservation-specific verification snapshot — 2026-10-29 (read-only audit)

- **Latest feature-branch CI:** PR run `40791589357` and push run `40791579884` passed at commit `84923a79c0ba39190f8b51a34780764308cba028`; 69 pgTAP tests passed. These tests include sequential overlapping-party capacity checks (4 + 2 allowed, additional party rejected). This is **not** evidence of concurrent-request safety or browser acceptance.
- **Production configuration:** `enabled=false` for Ossington, Baldwin and Dupont; `capacity`, `slot_interval_minutes`, `max_advance_days` and `min_advance_minutes` remain NULL. Duration is 90 minutes; timezone is `America/Toronto`. Dupont hours are 09:00–15:30 in production, while the approved branch configuration is 08:00–18:30 daily for all three. No settings were changed in this audit.
- **Edge Function:** `reservation-create` is ACTIVE (version 1, JWT verification disabled for anonymous guest requests). Do not confuse function deployment with enabling customer reservations. Verify deployed source/configuration and origin allowlist before any rollout; never disclose server secrets.
- **Security advisor:** informational `rls_enabled_no_policy` notice on `public.request_rate_limits`; confirm service-role-only grants and absence of client access before deciding whether any policy change is warranted. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .
- **Performance advisor:** 12 multiple-permissive-policy findings and 10 unused-index findings. Assess for correctness and realistic workloads; do not remove indexes or change RLS policies blindly. See https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies .

### Required reservation acceptance evidence (still outstanding)

1. **Concurrency:** On an isolated disposable database, fire simultaneous requests for the same 90-minute window and verify committed overlapping guest totals never exceed six. Cover independent connections, partial availability and cancelled reservations; capture test command and results.
2. **Toronto time and DST:** Validate spring-forward and fall-back dates, offset-aware input, local opening/closing boundaries, 24-hour notice, 30-day maximum, and 60-minute slot alignment. Document expected and actual outcomes.
3. **Authorization:** Exercise anonymous, customer, staff, manager and owner identities against reservations, settings, internal notes, orders and order items; verify denied reads/writes and role revocation. Inspect server-only RPC grants and public Edge Function validation.
4. **Customer browser flow:** In a staging deployment, check location selection, date/time/party-size validation, full-capacity and disabled states, confirmation-code display, network failures, mobile/keyboard accessibility and rate limiting; use test-only identities and avoid production customer records.
5. **Release gate:** Review origins, secrets, monitoring, backups, rollback, cancellation/rescheduling and notification workflow; obtain Rooms' business sign-off. Only then consider merging and a controlled deployment. This audit does not authorize deployment or enabling bookings.

**Release status:** NOT DEPLOYMENT-READY. Backend Edge Function deployed previously; customer reservation feature remains disabled. No merge, deployment or production mutation was performed in this audit.
