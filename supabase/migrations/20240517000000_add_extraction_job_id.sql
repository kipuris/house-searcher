-- Add extraction_job_id column to listings table
ALTER TABLE public.listings 
ADD COLUMN extraction_job_id text DEFAULT NULL;

-- Add index for faster job ID lookups
CREATE INDEX listings_extraction_job_id_idx ON public.listings (extraction_job_id);

-- Add comment to describe the column
COMMENT ON COLUMN public.listings.extraction_job_id IS 'Firecrawl extraction job ID for async processing'; 