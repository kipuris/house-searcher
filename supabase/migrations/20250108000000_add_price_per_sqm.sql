-- Add price_per_sqm field to listings table
alter table public.listings 
add column price_per_sqm numeric(10,2);

-- Add comment to describe the new column
comment on column public.listings.price_per_sqm is 'Price per square meter of the property';

-- Create index for price per sqm queries
create index listings_price_per_sqm_idx on public.listings (price_per_sqm);
