# 915 Dupont / Rooms Coffee — backend foundation

This repository currently contains a static HTML/CSS/JavaScript website. The existing customer-facing design is preserved. Backend work is being introduced separately and must not be represented as production-ready until migrations, security tests and end-to-end acceptance pass.

## Architecture
- Existing frontend: keep the current visual system and page structure.
- Database and authentication: Supabase (PostgreSQL + Supabase Auth).
- Secure access: Row Level Security (RLS); owner/manager/staff/customer roles.
- Media: Supabase Storage only after buckets and access policies are configured.
- Server-side operations: Supabase Edge Functions for guest booking, future order creation, payment webhooks and transactional notifications.
- Payments: integrate a provider only after Rooms confirms its account, currency, tax/shipping rules and fulfillment workflow. Do not store card data.

## Current foundation
The initial migration and hardening migrations provide:
- staff/customer profiles and role permissions
- locations, menu categories and menu items
- shop products and inventory fields
- reservations and status tracking
- orders and order line items
- catering enquiries, editable website content and audit logs
- staff-only reservation notes and protected audit triggers

The feature branch also adds a configurable reservation-settings table, a server-only transactional guest-reservation RPC, a hashed-key rate-limit table/function, a guest reservation Edge Function, and manager-only reservation settings in the admin workspace. The reservation database migration has been applied to the connected development Supabase project and its migration history reconciled. The three website-listed locations (135 Ossington, 17 Baldwin and 915 Dupont) are seeded in development for admin setup. Reservation rules remain absent and disabled until Rooms confirms them. The Edge Function and frontend integration remain undeployed.

## Setup and release sequence
1. Confirm that Rooms controls the Supabase project and hosting, and grant only least-privilege access to implementation staff.
2. Confirm the legal business owner/data controller, data retention requirements, booking rules, cancellation policy, menu/product data and staff roles.
3. Apply all migrations to a clean disposable development database first. Review lint output and test every RLS policy before touching production.
4. Create the first owner in Supabase Auth, then assign the `owner` role through a trusted SQL editor. Never let public signup choose a privileged role.
5. Configure each location's `reservation_settings`: IANA timezone, opening hours, capacity, reservation duration, slot interval, maximum days ahead, minimum notice and maximum party size. Opening-hours JSON uses weekday keys (for example `monday`) with arrays such as `[{"open":"08:00","close":"17:00"}]`. Overnight windows are not supported. Keep `enabled=false` until the rules are reviewed.
6. Configure the Edge Function secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ALLOWED_ORIGINS` in Supabase. Never commit or expose the service-role key in browser code.
7. The public `reservation-create` function intentionally uses `verify_jwt = false` because guests are not signed in. Do not deploy it until `ALLOWED_ORIGINS` is set to exact approved origins and rate-limit, concurrency, timezone and daylight-saving tests pass. The endpoint fails closed if required secrets/configuration are absent.
8. Select Rooms' payment provider and email/SMS provider before implementing order creation, inventory reservation/release, signed and idempotent payment webhooks, refund handling, transactional notifications and delivery retries.
9. Configure Storage buckets only if the product actually needs uploads; define public/private access, MIME/size limits and ownership rules before enabling uploads.
10. Deploy the admin behind authenticated access and test owner/manager/staff/customer authorization, recovery, sign-out, keyboard navigation and mobile behavior.
11. Move off GitHub Pages only when a host supporting the selected server-side/runtime setup is configured. Keep the existing live customer-facing site unchanged until Rooms explicitly accepts the new implementation.

## Not yet live
The reservation database migration has been applied to the connected development Supabase project; the Edge Function remains committed to the feature branch and is not deployed. Location rows are seeded, but verified opening-hour JSON and reservation rules have not been configured, so guest reservation requests remain disabled. No order/payment integration, payment webhooks, transactional email or live booking form is active. Those steps require Rooms-owned credentials, business decisions, end-to-end testing and explicit deployment approval.
