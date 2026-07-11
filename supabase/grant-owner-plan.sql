-- One-time: grant Team (or Pro) to your account without Stripe.
-- Run in Supabase SQL Editor. Replace the email below.

-- 1) Subscription row (powers plan limits in the app)
insert into public.subscriptions (user_id, plan, status, seats, updated_at)
select id, 'team', 'active', 10, now()
from auth.users
where lower(email) = lower('you@example.com')
on conflict (user_id) do update
set plan = excluded.plan,
    status = excluded.status,
    seats = excluded.seats,
    updated_at = now();

-- 2) Organization row (agency / team features)
update public.organizations
set plan = 'team'
where owner_id in (
  select id from auth.users where lower(email) = lower('you@example.com')
);
