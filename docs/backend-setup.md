# 915 Dupont / Rooms Coffee — backend foundation

This repository currently contains a static HTML/CSS/JavaScript website. The existing customer-facing design is preserved. Backend work is being introduced separately and must not be represented as production-ready until a client-owned Supabase project is configured and end-to-end tests pass.

## Architecture
- Existing frontend: keep the current visual system and page structure.
- Database and authentication: Supabase (PostgreSQL + Supabase Auth).
- Secure access: Row Level Security (RLS); owner/manager/staff/customer roles.
- Media: Supabase Storage for client-approved images after access policies are configured.
- Server-side operations: Edge Functions for booking validation, payment provider webhooks, order creation and transactional notifications.
- Payments: integrate a provider only after Rooms confirms its account, currency, tax/shipping rules and fulfillment workflow. Do not store card data.

## Current foundation
The migration in `supabase/migrations/202610090001_initial_rooms_schema.sql` creates initial tables and RLS policies for:
- staff/customer profiles and role permissions
- locations, menu categories and menu items
- shop products and inventory fields
- reservations and status tracking
- orders and order line items
- catering enquiries
- editable website content and audit logs

## Setup (client-owned accounts)
1. Have Rooms create and own its Supabase organization/project, and add the implementation developer with appropriate least-privilege access.
2. Confirm the legal business owner, data controller, retention requirements, booking rules, cancellation policy, menu/product data, and staff roles.
3. Apply the migration in a disposable development project first. Review and test every RLS policy before production.
4. Create the first owner in Supabase Auth, then assign the `owner` role through the trusted SQL editor. Never let public signup choose a privileged role.
5. Configure Storage buckets and policies; keep private operational documents private.
6. Configure secrets only in Supabase project secrets / server environment. Never commit credentials or expose service-role keys in frontend JavaScript.
7. Connect the current website via a public/publishable key only after RLS is tested.
8. Implement and test server-side reservation availability, conflict prevention, rate limits, spam protection, order totals, inventory adjustments, signed payment webhooks, emails and audit events.
9. Deploy admin behind authenticated routes and test owner/manager/staff permissions on desktop and mobile.
10. Move from GitHub Pages only when a production host supporting the chosen server-side/runtime setup is configured. Keep the current live site unchanged until acceptance.

## Not yet live
This commit does **not** provision a Supabase project, create accounts, process payments, send emails, or connect live booking forms. Those steps require Rooms-owned credentials, business decisions and explicit deployment approval.
