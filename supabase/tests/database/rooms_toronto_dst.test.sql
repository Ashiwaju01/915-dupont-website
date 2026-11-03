begin;
select plan(6);

-- Toronto's 2027 spring-forward transition: clocks jump from 01:59:59 to 03:00:00.
select is(
  to_char(('2027-03-14 01:30:00'::timestamp at time zone 'America/Toronto') at time zone 'UTC', 'YYYY-MM-DD HH24:MI'),
  '2027-03-14 06:30',
  'Toronto 01:30 before spring-forward resolves to 06:30 UTC'
);
select is(
  to_char(('2027-03-14 03:30:00'::timestamp at time zone 'America/Toronto') at time zone 'UTC', 'YYYY-MM-DD HH24:MI'),
  '2027-03-14 07:30',
  'Toronto 03:30 after spring-forward resolves to 07:30 UTC'
);

-- Toronto's 2026 fall-back transition repeats the 01:00 hour.
select is(
  to_char(('2026-11-01 00:30:00'::timestamp at time zone 'America/Toronto') at time zone 'UTC', 'YYYY-MM-DD HH24:MI'),
  '2026-11-01 04:30',
  'Toronto 00:30 before fall-back resolves to 04:30 UTC'
);
select is(
  to_char(('2026-11-01 01:30:00'::timestamp at time zone 'America/Toronto') at time zone 'UTC', 'YYYY-MM-DD HH24:MI'),
  '2026-11-01 06:30',
  'PostgreSQL resolves ambiguous Toronto 01:30 to the standard-time occurrence'
);
select is(
  to_char('2026-11-01 05:30:00+00'::timestamptz at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'),
  to_char('2026-11-01 06:30:00+00'::timestamptz at time zone 'America/Toronto', 'YYYY-MM-DD HH24:MI'),
  'the two fall-back UTC instants display the same Toronto wall-clock time'
);
select isnt(
  '2026-11-01 05:30:00+00'::timestamptz,
  '2026-11-01 06:30:00+00'::timestamptz,
  'the repeated local time still represents two distinct instants'
);

select * from finish();
rollback;
