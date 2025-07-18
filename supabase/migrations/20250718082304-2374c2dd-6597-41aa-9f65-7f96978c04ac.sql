
-- Remove the thumbnail_text column from content_packs table since we're no longer using it
ALTER TABLE public.content_packs DROP COLUMN IF EXISTS thumbnail_text;
