-- ============================================================================
-- Out of Sight — Review moderation
-- ============================================================================
-- Adds an `approved` flag to reviews so new customer reviews stay hidden on the
-- public site until you approve them in the admin panel.
--
--   * Existing reviews are backfilled to approved = true (they were already
--     public, so they keep showing).
--   * New reviews default to approved = false (hidden until you approve).
--   * Public visitors can only SELECT approved reviews; the logged-in admin can
--     see all reviews and flip `approved`.
--
-- Run this once in Supabase dashboard -> SQL Editor. Safe to re-run.
-- (Assumes supabase_security_setup.sql has already been applied.)
-- ============================================================================

-- 1. Add the column (nullable first so we can backfill existing rows safely)
alter table public.reviews add column if not exists approved boolean;

-- 2. Backfill: any review that predates this migration is already public -> keep it
update public.reviews set approved = true where approved is null;

-- 3. From now on new reviews are hidden by default
alter table public.reviews alter column approved set default false;
alter table public.reviews alter column approved set not null;

-- 4. Policies: public sees only approved; admin sees all and can approve/hide
drop policy if exists "reviews public read"   on public.reviews;
drop policy if exists "reviews admin read"    on public.reviews;
drop policy if exists "reviews public insert" on public.reviews;
drop policy if exists "reviews admin update"  on public.reviews;
drop policy if exists "reviews admin delete"  on public.reviews;

create policy "reviews public read"   on public.reviews for select to anon                using (approved = true);
create policy "reviews admin read"    on public.reviews for select to authenticated       using (true);
create policy "reviews public insert" on public.reviews for insert to anon, authenticated with check (true);
create policy "reviews admin update"  on public.reviews for update to authenticated       using (true) with check (true);
create policy "reviews admin delete"  on public.reviews for delete to authenticated       using (true);

-- 5. Confirmation: pending vs approved counts
select
  count(*) filter (where approved)     as approved_reviews,
  count(*) filter (where not approved) as pending_reviews
from public.reviews;
