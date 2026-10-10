-- Rooms Coffee / 915 Dupont backend foundation
-- Apply through the Supabase SQL editor or Supabase CLI after creating a CLIENT-OWNED project.
create extension if not exists pgcrypto;

create type public.staff_role as enum ('owner', 'manager', 'staff', 'customer');
create type public.reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
create type public.order_status as enum ('pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded');
create type public.enquiry_status as enum ('new', 'in_review', 'responded', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.staff_role not null default 'customer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text not null,
  description text,
  opening_hours jsonb not null default '{}'::jsonb,
  phone text,
  email text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.locations(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (location_id, slug)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete restrict,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'CAD',
  image_url text,
  dietary_tags text[] not null default '{}',
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'CAD',
  image_url text,
  sku text unique,
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  location_id uuid not null references public.locations(id) on delete restrict,
  customer_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  party_size smallint not null check (party_size between 1 and 20),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.reservation_status not null default 'pending',
  customer_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index reservations_location_time_idx on public.reservations(location_id, starts_at);
create index reservations_customer_idx on public.reservations(customer_id);
create index reservations_status_idx on public.reservations(status);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  status public.order_status not null default 'pending',
  currency char(3) not null default 'CAD',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  payment_provider text,
  payment_reference text unique,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  shipping_address jsonb,
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create table public.catering_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  event_date date,
  guest_count integer check (guest_count is null or guest_count > 0),
  event_type text,
  message text not null,
  status public.enquiry_status not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  title text,
  body text,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Keep modification timestamps accurate for records that expose updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  new.updated_at = now();
  return new;
end;
$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_locations on public.locations;
create trigger set_updated_at_locations before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_menu_items on public.menu_items;
create trigger set_updated_at_menu_items before update on public.menu_items
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_reservations on public.reservations;
create trigger set_updated_at_reservations before update on public.reservations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_orders on public.orders;
create trigger set_updated_at_orders before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_catering_enquiries on public.catering_enquiries;
create trigger set_updated_at_catering_enquiries before update on public.catering_enquiries
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_site_content on public.site_content;
create trigger set_updated_at_site_content before update on public.site_content
for each row execute function public.set_updated_at();

-- SECURITY DEFINER helper avoids recursive RLS when checking staff permissions.
create or replace function public.has_staff_role(allowed_roles public.staff_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.active = true
      and p.role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.products enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.catering_enquiries enable row level security;
alter table public.site_content enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users can see/update their own basic profile; only owner/manager can manage roles.
create policy "profile read self or managers" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.has_staff_role(array['owner','manager']::public.staff_role[]));
create policy "profile update self basic" on public.profiles for update to authenticated
using (id = (select auth.uid()) and role = 'customer')
with check (id = (select auth.uid()) and role = 'customer');
create policy "owner manages profiles" on public.profiles for all to authenticated
using (public.has_staff_role(array['owner']::public.staff_role[]))
with check (public.has_staff_role(array['owner']::public.staff_role[]));

-- Public site data is read-only for anonymous visitors; writes require authorized staff.
create policy "public read active locations" on public.locations for select to anon, authenticated using (is_active or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "staff manage locations" on public.locations for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));

create policy "public read active categories" on public.menu_categories for select to anon, authenticated using (is_active or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "managers manage categories" on public.menu_categories for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));

create policy "public read available menu" on public.menu_items for select to anon, authenticated using (is_available or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "staff manage menu" on public.menu_items for all to authenticated
using (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

create policy "public read active products" on public.products for select to anon, authenticated using (is_active or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "managers manage products" on public.products for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));

-- Reservations: customers can create and view their own; staff can manage all.
create policy "customer read own reservations" on public.reservations for select to authenticated
using (customer_id = (select auth.uid()) or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "customer create reservation" on public.reservations for insert to authenticated
with check (customer_id = (select auth.uid()) and status = 'pending' and internal_notes is null);
create policy "staff manage reservations" on public.reservations for all to authenticated
using (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

create policy "customer read own orders" on public.orders for select to authenticated
using (customer_id = (select auth.uid()) or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
-- Financial/order mutations are restricted to owner/manager until trusted server-side
-- payment and fulfillment workflows are implemented. Staff can still read orders above.
create policy "managers manage orders" on public.orders for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));
create policy "customer read own order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid()) or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]))));
create policy "managers manage order items" on public.order_items for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));

-- Public enquiry submissions are permitted; only staff may read or update enquiries.
create policy "public submit catering enquiry" on public.catering_enquiries for insert to anon, authenticated with check (status = 'new' and internal_notes is null);
create policy "staff manage catering enquiries" on public.catering_enquiries for all to authenticated
using (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

create policy "public read published content" on public.site_content for select to anon, authenticated
using (is_published or public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));
create policy "managers manage site content" on public.site_content for all to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]))
with check (public.has_staff_role(array['owner','manager']::public.staff_role[]));

create policy "owner and managers read audit logs" on public.audit_logs for select to authenticated
using (public.has_staff_role(array['owner','manager']::public.staff_role[]));
create policy "staff insert audit logs" on public.audit_logs for insert to authenticated
with check (actor_id = (select auth.uid()) and public.has_staff_role(array['owner','manager','staff']::public.staff_role[]));

-- Explicitly avoid anonymous writes to business-critical tables.
revoke all on public.profiles, public.locations, public.menu_categories, public.menu_items,
  public.products, public.reservations, public.orders, public.order_items,
  public.catering_enquiries, public.site_content, public.audit_logs from anon;
grant select on public.locations, public.menu_categories, public.menu_items, public.products, public.site_content to anon;
grant insert on public.catering_enquiries to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.locations, public.menu_categories, public.menu_items,
  public.products, public.reservations, public.orders, public.order_items,
  public.catering_enquiries, public.site_content to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- IMPORTANT: assign the first owner manually from the trusted Supabase SQL editor after
-- creating that user's Auth account. Never expose service-role credentials in browser code.


-- Create a least-privilege customer profile for each new Auth account.
-- New accounts never receive a staff role from user-controlled metadata.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'::public.staff_role,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rooms_profile on auth.users;
create trigger on_auth_user_created_rooms_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
