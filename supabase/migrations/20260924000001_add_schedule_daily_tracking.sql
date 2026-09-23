-- Sprint 2, items 2.1/2.2/2.4 of the improvement plan (scheduler reliability).
--
-- The generate/report cron jobs used to decide "is it time yet?" by
-- comparing generate_time/report_time to the current minute with ===. If the
-- backend was down (or the tick was just slow) during that exact minute,
-- the user got skipped for the entire day — there was no "catch up" signal.
--
-- These columns record the last Bangkok-local calendar date each job
-- actually completed for a user, so the scheduler can instead ask "is it
-- past time, AND have we not already done this today?" — which recovers
-- automatically after a restart — and can also use an atomic UPDATE on
-- these columns as a claim/lock against duplicate runs when more than one
-- backend instance is scheduled.
--
-- Idempotent: safe to re-run.

alter table if exists public.users
  add column if not exists last_generated_on date,
  add column if not exists last_reported_on date;
