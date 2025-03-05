-- Add markdown_content column to listings table
ALTER TABLE public.listings 
ADD COLUMN markdown_content text DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN public.listings.markdown_content IS 'Markdown content scraped from the property listing URL';

-- Add the same column to team_listings table
ALTER TABLE public.team_listings
ADD COLUMN markdown_content text DEFAULT NULL;

-- Add comment to describe the column in team_listings
COMMENT ON COLUMN public.team_listings.markdown_content IS 'Markdown content scraped from the property listing URL';

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
        extraction_job_id = EXCLUDED.extraction_job_id,
        markdown_content = EXCLUDED.markdown_content;
    
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
