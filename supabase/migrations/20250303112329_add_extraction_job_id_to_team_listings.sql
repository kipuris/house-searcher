-- Add extraction_job_id column to team_listings table
ALTER TABLE public.team_listings 
ADD COLUMN extraction_job_id text DEFAULT NULL;

-- Add index for faster job ID lookups
CREATE INDEX team_listings_extraction_job_id_idx ON public.team_listings (extraction_job_id);

-- Add comment to describe the column
COMMENT ON COLUMN public.team_listings.extraction_job_id IS 'Firecrawl extraction job ID for async processing';

-- Update the sync_team_listings function to include the new column
CREATE OR REPLACE FUNCTION sync_team_listings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.team_listings
    SELECT DISTINCT l.*
    FROM public.listings l
    JOIN public.team_members tm ON l.user_id = tm.user_id
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        url = EXCLUDED.url,
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        location = EXCLUDED.location,
        bedroom_count = EXCLUDED.bedroom_count,
        image = EXCLUDED.image,
        last_checked = EXCLUDED.last_checked,
        change_history = EXCLUDED.change_history,
        updated_flag = EXCLUDED.updated_flag,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        extraction_job_id = EXCLUDED.extraction_job_id;
    
    -- Handle deletions by removing records that no longer exist in source tables
    -- or are no longer shared in any team
    DELETE FROM public.team_listings tl
    WHERE NOT EXISTS (
        SELECT 1 
        FROM public.listings l
        JOIN public.team_members tm ON l.user_id = tm.user_id
        WHERE l.id = tl.id
    );
    
    RETURN NULL;
END;
$$;
