-- Create folders table
create table public.folders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create folder_listings junction table
create table public.folder_listings (
    id uuid primary key default gen_random_uuid(),
    folder_id uuid references public.folders(id) on delete cascade not null,
    listing_id uuid references public.listings(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(folder_id, listing_id)
);

-- Add comments
comment on table public.folders is 'User-created folders to organize listings';
comment on table public.folder_listings is 'Junction table linking listings to folders';

-- Enable RLS
alter table public.folders enable row level security;
alter table public.folder_listings enable row level security;

-- Create indexes
create index folders_user_id_idx on public.folders(user_id);
create index folder_listings_folder_id_idx on public.folder_listings(folder_id);
create index folder_listings_listing_id_idx on public.folder_listings(listing_id);

-- Create policies for folders
create policy "Users can view their own folders"
    on public.folders
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own folders"
    on public.folders
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own folders"
    on public.folders
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own folders"
    on public.folders
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create policies for folder_listings
create policy "Users can view their folder listings"
    on public.folder_listings
    for select
    to authenticated
    using (
        exists (
            select 1 from public.folders f
            where f.id = folder_id
            and f.user_id = auth.uid()
        )
    );

create policy "Users can add listings to their folders"
    on public.folder_listings
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.folders f
            where f.id = folder_id
            and f.user_id = auth.uid()
        )
    );

create policy "Users can remove listings from their folders"
    on public.folder_listings
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.folders f
            where f.id = folder_id
            and f.user_id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
create trigger update_folders_updated_at
    before update on public.folders
    for each row
    execute function public.handle_updated_at(); 