-- Tighten application table grants for the Rooms Coffee backend.
-- RLS controls rows; these grants remove dangerous table-level capabilities such as TRUNCATE.
revoke all privileges on table
  public.profiles,
  public.locations,
  public.menu_categories,
  public.menu_items,
  public.products,
  public.reservations,
  public.orders,
  public.order_items,
  public.catering_enquiries,
  public.site_content,
  public.audit_logs
from anon, authenticated;

-- Anonymous visitors may read public-facing content and submit catering enquiries.
grant select on table
  public.locations,
  public.menu_categories,
  public.menu_items,
  public.products,
  public.site_content
to anon;
grant insert on table public.catering_enquiries to anon;

-- Signed-in users receive only the operations needed by the current RLS policies.
-- Row-level policies still determine which rows and mutations each user may access.
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table
  public.locations,
  public.menu_categories,
  public.menu_items,
  public.products,
  public.reservations,
  public.orders,
  public.order_items,
  public.catering_enquiries,
  public.site_content
to authenticated;
grant select, insert on table public.audit_logs to authenticated;

-- Deliberately do not grant TRUNCATE, TRIGGER, or REFERENCES to anon/authenticated.
