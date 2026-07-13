-- ============================================================================
-- Out of Sight — Supabase security setup (Row Level Security + safe checkout)
-- ============================================================================
-- WHY: The anon key is embedded in every public page (normal for Supabase), so
-- security depends ENTIRELY on Row Level Security (RLS). Without this, the anon
-- key can UPDATE the products table (anyone can rewrite prices/stock) and
-- read/insert/delete rows in `orders` (customer name/phone/address exposed).
--
-- IMPORTANT: This script first DROPS EVERY existing policy on oos/orders/reviews
-- (older "allow everyone" policies are OR'd with new ones and would otherwise
-- keep the tables wide open), then enables RLS with least-privilege policies.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
-- Safe to re-run. The final query prints RLS status so you can confirm it took.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Atomic order placement (used by index.html + vintage.html checkout)
-- ----------------------------------------------------------------------------
-- Runs as the function owner (postgres) so it bypasses RLS to write the two
-- tables, while the public role itself has no direct write access.
create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_items         jsonb,
  p_total_price   numeric
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id  bigint;
  item    jsonb;
  item_id bigint;
begin
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'INVALID_NAME';
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if coalesce(p_total_price, -1) < 0 then
    raise exception 'INVALID_TOTAL';
  end if;

  insert into public.orders (customer_name, phone, address, items, total_price)
  values (p_customer_name, p_phone, p_address, p_items, p_total_price)
  returning id into new_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    item_id := nullif(item->>'id', '')::bigint;
    if item_id is not null then
      update public.oos set stock = greatest(0, stock - 1) where id = item_id;
    end if;
  end loop;

  return new_id;
end;
$$;

revoke all     on function public.place_order(text, text, text, jsonb, numeric) from public;
grant  execute on function public.place_order(text, text, text, jsonb, numeric) to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 2. Wipe ALL existing policies on the three tables (removes stale "allow all")
-- ----------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('oos', 'orders', 'reviews')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 3. Enable RLS + least-privilege policies
-- ----------------------------------------------------------------------------
-- Products (oos): public reads; only logged-in admin writes.
alter table public.oos enable row level security;
create policy "oos public read"  on public.oos for select to anon, authenticated using (true);
create policy "oos admin insert" on public.oos for insert to authenticated with check (true);
create policy "oos admin update" on public.oos for update to authenticated using (true) with check (true);
create policy "oos admin delete" on public.oos for delete to authenticated using (true);

-- Orders: NO public access. Created only via place_order(); managed by admin.
alter table public.orders enable row level security;
create policy "orders admin read"   on public.orders for select to authenticated using (true);
create policy "orders admin update" on public.orders for update to authenticated using (true) with check (true);
create policy "orders admin delete" on public.orders for delete to authenticated using (true);

-- Reviews: public read + public submit; only admin deletes.
alter table public.reviews enable row level security;
create policy "reviews public read"   on public.reviews for select to anon, authenticated using (true);
create policy "reviews public insert" on public.reviews for insert to anon, authenticated with check (true);
create policy "reviews admin delete"  on public.reviews for delete to authenticated using (true);


-- ----------------------------------------------------------------------------
-- 4. Confirmation (this result grid should show rls_enabled = true for all 3)
-- ----------------------------------------------------------------------------
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('oos', 'orders', 'reviews')
order by tablename;


-- ============================================================================
-- AFTER RUNNING
-- ============================================================================
-- * Create an admin login if you haven't: Authentication -> Users -> Add user.
--   The admin (oosadmin.html) + stats (oosstats.html) now require being logged in.
-- * Deploy the updated index.html + vintage.html (they call place_order()).
-- ============================================================================
