-- ============================================================================
-- Out of Sight — switch product image paths from .png to .webp
-- ============================================================================
-- After the PNG product photos were converted to WebP, point the product rows
-- at the new files. `thumb` is text; `images` is a jsonb array. Only rows that
-- still reference a .png are touched, so this is safe to re-run (idempotent).
--
-- RUN THIS AFTER the .webp files are live on the site (so the new paths resolve).
-- Supabase dashboard -> SQL Editor -> paste -> Run.
-- ============================================================================

update public.oos
set
  thumb  = replace(thumb, '.png', '.webp'),
  images = replace(images::text, '.png', '.webp')::jsonb
where thumb like '%.png%'
   or images::text like '%.png%';

-- Confirmation: these should now all end in .webp (b4.jpg stays .jpg)
select id, cat, thumb, images
from public.oos
where thumb like '%.webp%' or images::text like '%.webp%'
order by id;
