-- Sprint 1, item 1.6 of the security hardening plan.
--
-- This app has no Supabase Auth session — end users are authenticated with
-- our own bcrypt + JWT scheme (see frontend/lib/auth.ts), and every
-- privileged read/write is now done with the Supabase *service role* key
-- from trusted server code only, after that code has verified the caller's
-- JWT itself (see frontend/lib/supabase-admin.ts).
--
-- That means the public `anon` key — shipped to every browser as
-- NEXT_PUBLIC_SUPABASE_ANON_KEY — has NO legitimate use in this app. Until
-- now, several server routes queried these tables with the anon client
-- (frontend/lib/supabase.ts, since removed), which only worked because RLS
-- was left disabled: the anon key could read/write any row, including
-- password_hash, page_access_token and LINE access tokens, directly from a
-- browser, bypassing every check the app performs.
--
-- Run this once against your Supabase project (SQL Editor, or
-- `supabase db push` if you adopt the CLI) to close that off: enable RLS on
-- every table with no policies, which — per Postgres RLS semantics — means
-- `anon` and `authenticated` can see and change nothing, ever, no matter
-- what a route or a leaked key attempts. The `service_role` key used by the
-- backend and by frontend/lib/supabase-admin.ts is unaffected: Supabase
-- grants it BYPASSRLS.
--
-- Idempotent: safe to re-run.

alter table if exists public.users enable row level security;
alter table if exists public.post_drafts enable row level security;
alter table if exists public.product_groups enable row level security;
alter table if exists public.reference_images enable row level security;
alter table if exists public.line_connections enable row level security;
alter table if exists public.facebook_connections enable row level security;
alter table if exists public.facebook_pages enable row level security;
alter table if exists public.competitors enable row level security;
alter table if exists public.competitor_posts enable row level security;
alter table if exists public.competitor_insights enable row level security;
alter table if exists public.competitor_scrape_jobs enable row level security;
alter table if exists public.own_page_insights enable row level security;
alter table if exists public.replied_comments enable row level security;

-- Belt-and-suspenders: even if RLS were ever disabled again by mistake,
-- these roles should hold no table privileges at all in this app.
revoke all on all tables in schema public from anon, authenticated;
