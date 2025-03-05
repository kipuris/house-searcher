-- Create teams table
create table public.teams (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_by uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create team_members table
create table public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid not null,
    added_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now(),
    unique(team_id, user_id)
);

-- Add foreign key to users_view
ALTER TABLE public.team_members
ADD CONSTRAINT fk_team_members_user
FOREIGN KEY (user_id)
REFERENCES public.users_view(id)
ON DELETE CASCADE;

-- Add comments
comment on table public.teams is 'Teams that users can create and join to share listings';
comment on table public.team_members is 'Members of teams with their roles';

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Create indexes
create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_user_id_idx on public.team_members(user_id);

-- Create helper function to check team membership (bypasses RLS)
create or replace function public.is_team_member(_user_id uuid, _team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.team_members
        where team_id = _team_id
        and user_id = _user_id
    ) or exists (
        select 1
        from public.teams
        where id = _team_id
        and created_by = _user_id
    );
$$;

-- Function to create a team and add creator as member
create or replace function public.create_team(team_name text, creator_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    new_team_id uuid;
begin
    -- Insert the team
    insert into public.teams (name, created_by)
    values (team_name, creator_id)
    returning id into new_team_id;

    -- Add creator as member
    insert into public.team_members (team_id, user_id, added_by)
    values (new_team_id, creator_id, creator_id);

    return new_team_id;
end;
$$;

-- Create RLS policies for teams
create policy "Users can view their teams"
    on public.teams
    for select
    to authenticated
    using (
        is_team_member(auth.uid(), id)
    );

create policy "Users can create teams"
    on public.teams
    for insert
    to authenticated
    with check (auth.uid() = created_by);

create policy "Team creators can update their teams"
    on public.teams
    for update
    to authenticated
    using (auth.uid() = created_by)
    with check (auth.uid() = created_by);

create policy "Team creators can delete their teams"
    on public.teams
    for delete
    to authenticated
    using (auth.uid() = created_by);

-- Create RLS policies for team_members
create policy "Users can view team members"
    on public.team_members
    for select
    to authenticated
    using (
        is_team_member(auth.uid(), team_id)
    );

create policy "Team creators can add members"
    on public.team_members
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.teams
            where teams.id = team_members.team_id
            and teams.created_by = auth.uid()
        )
    );

create policy "Team creators can remove members"
    on public.team_members
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.teams
            where teams.id = team_members.team_id
            and teams.created_by = auth.uid()
        )
    );

-- Create team_listings table
CREATE TABLE public.team_listings (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    url text NOT NULL,
    title text NOT NULL,
    price numeric(12,2) NOT NULL,
    currency text NOT NULL,
    location text NOT NULL,
    bedroom_count integer NOT NULL,
    image text,
    last_checked timestamptz,
    change_history jsonb,
    updated_flag boolean,
    created_at timestamptz,
    updated_at timestamptz
);

-- Enable RLS
ALTER TABLE public.team_listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_listings
CREATE POLICY "Users can view listings from their teams"
ON public.team_listings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.team_id IN (
            SELECT team_id 
            FROM public.team_members 
            WHERE user_id = team_listings.user_id
        )
    )
    OR user_id = auth.uid()  -- Users can always see their own listings
);

-- Function for initial sync
CREATE OR REPLACE FUNCTION initialize_team_listings()
RETURNS void
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
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function for trigger-based sync
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
        updated_at = EXCLUDED.updated_at;
    
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

-- Create triggers to keep the table in sync
CREATE TRIGGER sync_team_listings_on_listings
AFTER INSERT OR UPDATE OR DELETE ON public.listings
FOR EACH STATEMENT
EXECUTE FUNCTION sync_team_listings();

CREATE TRIGGER sync_team_listings_on_team_members
AFTER INSERT OR UPDATE OR DELETE ON public.team_members
FOR EACH STATEMENT
EXECUTE FUNCTION sync_team_listings();

-- Initial sync
SELECT initialize_team_listings();

-- Grant access to the table
GRANT SELECT ON public.team_listings TO authenticated;

-- Function to check if a user can be added to a team (must be approved)
create or replace function public.can_add_to_team(user_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    return exists (
        select 1 
        from auth.users u
        join public.user_approvals ua on u.id = ua.id
        where u.email = user_email
        and ua.is_approved = true
    );
end;
$$; 