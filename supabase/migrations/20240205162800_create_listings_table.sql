-- Create listings table to store property listings
create table public.listings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    url text not null,
    title text not null,
    price numeric(12,2) not null, -- Changed to numeric type for precise price storage
    currency text not null default 'EUR',
    location text not null,
    bedroom_count integer not null,
    image text,
    last_checked timestamptz default now(),
    change_history jsonb default '[]'::jsonb,
    updated_flag boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add comment to describe the table
comment on table public.listings is 'Property listings tracked by users for price and detail changes';

-- Enable RLS
alter table public.listings enable row level security;

-- Create index for faster user-based queries
create index listings_user_id_idx on public.listings (user_id);

-- Create index for URL lookups
create index listings_url_idx on public.listings (url);

-- Create policies for authenticated users
create policy "Users can view their own listings"
    on public.listings
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own listings"
    on public.listings
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own listings"
    on public.listings
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own listings"
    on public.listings
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create trigger for updated_at
create trigger update_listings_updated_at
    before update on public.listings
    for each row
    execute function public.handle_updated_at(); 