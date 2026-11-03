-- Make the default-deny browser access model explicit for the private rate-limit table.
-- service_role retains its existing table privileges and bypasses RLS.
create policy "deny browser access to reservation rate limits"
on public.request_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
