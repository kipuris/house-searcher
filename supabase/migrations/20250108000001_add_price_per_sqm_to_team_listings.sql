-- Add price_per_sqm field to team_listings table
alter table public.team_listings 
add column price_per_sqm numeric(10,2);

-- Add comment to describe the new column
comment on column public.team_listings.price_per_sqm is 'Price per square meter of the property';

-- Create index for price per sqm queries on team_listings
create index team_listings_price_per_sqm_idx on public.team_listings (price_per_sqm);
